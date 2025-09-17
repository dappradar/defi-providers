import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import ROCKET_NODE_MANAGER_ABI from './abi/rocketNodeManager.json';
import ROCKET_NODE_STAKING_ABI from './abi/rocketNodeStaking.json';
import ROCKET_VAULT_ABI from './abi/rocketVault.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 13325306;
const ROCKET_NODE_MANAGER = '0x2b52479F6ea009907e46fc43e91064D1b92Fdc86';
const ROCKET_NODE_STAKING = '0xF18Dc176C10Ff6D8b5A17974126D43301F8EEB95';
const ROCKET_VAULT = '0x3bdc69c4e5e13e52a65f5583c23efb9636b469d6';
const RPL = '0xd33526068d116ce69f19a9ee46f0bd304f21a51f';
const BACKFILL_NODE_FIRST_BLOCK = 21060563;

async function getNodeBalances(block, chain, provider, web3) {
  const nodeBlock =
    block < BACKFILL_NODE_FIRST_BLOCK ? BACKFILL_NODE_FIRST_BLOCK : block;

  const nodeLength = await util.executeCall(
    ROCKET_NODE_MANAGER,
    ROCKET_NODE_MANAGER_ABI,
    'getNodeCount',
    [],
    nodeBlock,
    chain,
    web3,
  );

  const batchSize = 100;
  const allNodes = [];

  for (let i = 0; i < nodeLength; i += batchSize) {
    const limit = Math.min(batchSize, nodeLength - i);

    const nodeAddresses = await util.executeCall(
      ROCKET_NODE_MANAGER,
      ROCKET_NODE_MANAGER_ABI,
      'getNodeAddresses',
      [i, limit],
      nodeBlock,
      chain,
      web3,
    );

    allNodes.push(...nodeAddresses);
  }

  const processBatchSize = 100;
  let totalEthMatched = BigNumber(0);
  let totalNodeEthProvided = BigNumber(0);

  for (let i = 0; i < allNodes.length; i += processBatchSize) {
    const batchNodes = allNodes.slice(i, i + processBatchSize);
    const nodeDetailsCalls = batchNodes.map((address) => [address]);

    const [nodeDetails, ethProvided] = await Promise.all([
      util.executeMultiCallsOfTarget(
        ROCKET_NODE_MANAGER,
        ROCKET_NODE_MANAGER_ABI,
        'getNodeDetails',
        nodeDetailsCalls,
        nodeBlock,
        chain,
        web3,
      ),
      util.executeMultiCallsOfTarget(
        ROCKET_NODE_STAKING,
        ROCKET_NODE_STAKING_ABI,
        'getNodeETHProvided',
        nodeDetailsCalls,
        nodeBlock,
        chain,
        web3,
      ),
    ]);

    nodeDetails.forEach((detail, index) => {
      if (detail && detail[0] === 'true') {
        const ethMatched = detail[10] || '0';
        const nodeEthProvided = ethProvided[index] || '0';

        totalEthMatched = totalEthMatched.plus(ethMatched);
        totalNodeEthProvided = totalNodeEthProvided.plus(nodeEthProvided);
      }
    });
  }

  return {
    ethMatched: totalEthMatched,
    nodeEthProvided: totalNodeEthProvided,
  };
}

async function calculateEthTvl(block, balances, chain, provider, web3) {
  const { ethMatched, nodeEthProvided } = await getNodeBalances(
    block,
    chain,
    provider,
    web3,
  );

  const rocketDepositPoolEthBalance = await util.executeCall(
    ROCKET_VAULT,
    ROCKET_VAULT_ABI,
    'balanceOf',
    ['rocketDepositPool'],
    block,
    chain,
    web3,
  );

  balances['eth'] = BigNumber(ethMatched)
    .plus(nodeEthProvided)
    .plus(rocketDepositPoolEthBalance);
}

async function calculateRplTvl(block, balances, chain, web3) {
  const totalRplStake = await util.executeCall(
    ROCKET_NODE_STAKING,
    ROCKET_NODE_STAKING_ABI,
    'getTotalRPLStake',
    [],
    block,
    chain,
    web3,
  );

  const [
    rocketDaoNodeTrustedActionsRplBalance,
    rocketAuctionManagerRplBalance,
  ] = await util.executeMultiCallsOfTarget(
    ROCKET_VAULT,
    ROCKET_VAULT_ABI,
    'balanceOfToken',
    [
      ['rocketDAONodeTrustedActions', RPL],
      ['rocketAuctionManager', RPL],
    ],
    block,
    chain,
    web3,
  );

  balances[RPL] = BigNumber(totalRplStake)
    .plus(rocketDaoNodeTrustedActionsRplBalance)
    .plus(rocketAuctionManagerRplBalance);
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};
  await Promise.all([
    calculateEthTvl(block, balances, chain, provider, web3),
    calculateRplTvl(block, balances, chain, web3),
  ]);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
