import BigNumber from 'bignumber.js';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import ROCKET_MINIPOOL_MANAGER_ABI from './abi/rocketMinipoolManager.json';
import ROCKET_NODE_STAKING_ABI from './abi/rocketNodeStaking.json';
import ROCKET_VAULT_ABI from './abi/rocketVault.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 13325306;
const ROCKET_MINIPOOL_MANAGER = '0x6293b8abc1f36afb22406be5f96d893072a8cf3a';
const ROCKET_NODE_STAKING = '0x3019227b2b8493e45bf5d25302139c9a2713bf15';
const ROCKET_VAULT = '0x3bdc69c4e5e13e52a65f5583c23efb9636b469d6';
const RPL = '0xd33526068d116ce69f19a9ee46f0bd304f21a51f';
const RETH = '0xae78736cd615f374d3085123a210448e74fc6393';

async function getEthLockedInMinipools(block, web3) {
  const limit = 400;

  let offset = 0;
  let initialisedMinipools = 0;
  let prelaunchMinipools = 0;
  let stakingMinipools = 0;
  let withdrawableMinipools = 0;
  const ROCKET_MINIPOOL_MANAGER_CONTRACT = new web3.eth.Contract(
    ROCKET_MINIPOOL_MANAGER_ABI,
    ROCKET_MINIPOOL_MANAGER,
  );
  while (true) {
    const activeMinipools = await ROCKET_MINIPOOL_MANAGER_CONTRACT.methods
      .getMinipoolCountPerStatus(offset, limit)
      .call(null, block);

    initialisedMinipools += parseInt(activeMinipools['initialisedCount']);
    prelaunchMinipools += parseInt(activeMinipools['prelaunchCount']);
    stakingMinipools += parseInt(activeMinipools['stakingCount']);
    withdrawableMinipools += parseInt(activeMinipools['withdrawableCount']);

    if (
      activeMinipools['initialisedCount'] +
        activeMinipools['prelaunchCount'] +
        activeMinipools['stakingCount'] +
        activeMinipools['withdrawableCount'] +
        activeMinipools['dissolvedCount'] <
      limit
    ) {
      break;
    }

    offset += limit;
  }

  return BigNumber(initialisedMinipools * 16)
    .plus(prelaunchMinipools * 32)
    .plus(stakingMinipools * 32)
    .plus(withdrawableMinipools * 32)
    .shiftedBy(18);
}

async function calculateEthTvl(block, balances, chain, web3) {
  const ethLockedInMinipools = await getEthLockedInMinipools(block, web3);

  const [rocketDepositPoolEthBalance, rocketTokenRethBalance] =
    await util.executeMultiCallsOfTarget(
      ROCKET_VAULT,
      ROCKET_VAULT_ABI,
      'balanceOf',
      ['rocketDepositPool', 'rocketTokenRETH'],
      block,
      chain,
      web3,
    );

  balances['eth'] = BigNumber(ethLockedInMinipools).plus(
    rocketDepositPoolEthBalance,
  );
  balances[RETH] = rocketTokenRethBalance;
}

async function calculateRplTvl(block, balances, chain, web3) {
  const [
    totalRplStake,
    [rocketDaoNodeTrustedActionsRplBalance, rocketAuctionManagerRplBalance],
  ] = await Promise.all([
    util.executeCall(
      ROCKET_NODE_STAKING,
      ROCKET_NODE_STAKING_ABI,
      'getTotalRPLStake',
      [],
      block,
      chain,
      web3,
    ),
    util.executeMultiCallsOfTarget(
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
    ),
  ]);

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
    calculateEthTvl(block, balances, chain, web3),
    calculateRplTvl(block, balances, chain, web3),
  ]);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
