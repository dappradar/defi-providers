import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import CHEF_ABI from './abi.json';
import TOKEN_ABI from './token.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const CHEF_ADDRESS = '0xa625ab01b08ce023b2a342dbb12a16f2c8489a8f';
let pools = {};

async function getPoolTokens(contract, id, web3) {
  try {
    if (!pools[id]) {
      const poolInfo = await contract.methods.poolInfo(id).call();

      const tokenContract = new web3.eth.Contract(
        TOKEN_ABI,
        poolInfo.stakeToken,
      );
      try {
        pools[id] = {
          stakeToken: poolInfo.stakeToken,
          token: (await tokenContract.methods.token().call()).toLowerCase(),
        };
      } catch {
        pools[id] = {
          stakeToken: poolInfo.stakeToken,
          token: poolInfo.stakeToken.toLowerCase(),
        };
      }
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const tokenBalances = {};

  const contract = new web3.eth.Contract(CHEF_ABI, CHEF_ADDRESS);
  let poolLength;
  try {
    poolLength = await contract.methods.poolLength().call(null, block);
  } catch {
    return {};
  }

  const poolIDs = Array.from({ length: poolLength }, (v, i) => i);

  try {
    pools = await basicUtil.readDataFromFile(
      'cache/pools.json',
      chain,
      provider,
    );
  } catch {}

  await Promise.all(poolIDs.map((id) => getPoolTokens(contract, id, web3)));

  basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  const results = await util.executeCallOfMultiTargets(
    poolIDs.map((id) => pools[id].stakeToken),
    TOKEN_ABI,
    'balanceOf',
    [CHEF_ADDRESS],
    block,
    chain,
    web3,
  );

  const wantBalances = [];
  poolIDs.forEach((id, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      wantBalances.push({
        token: pools[id].token,
        balance,
      });
    }
  });

  formatter.sumMultiBalanceOf(tokenBalances, wantBalances, chain, provider);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );

  return { balances };
}

export { tvl };
