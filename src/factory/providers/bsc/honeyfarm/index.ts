import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import CHEF_ABI from './abi.json';
import STRAT_ABI from './strat.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const CHEF_ADDRESS = '0x671e56C68047029F236f342b18632425C75885a3';
let pools = {};

async function getWants(contract, id) {
  try {
    if (!pools[id]) {
      const poolInfo = await contract.methods.poolInfo(id).call();
      pools[id] = {
        want: poolInfo.want.toLowerCase(),
        strat: poolInfo.strat,
      };
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 10562730) {
    return {};
  }

  const contract = new web3.eth.Contract(CHEF_ABI, CHEF_ADDRESS);
  let poolLength;
  try {
    poolLength = await contract.methods.poolLength().call(null, block);
  } catch {
    return {};
  }

  const poolIDs = Array.from({ length: poolLength }, (v, i) => i);

  try {
    pools = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  await Promise.all(poolIDs.map((id) => getWants(contract, id)));

  basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  const results = await util.executeCallOfMultiTargets(
    poolIDs.map((id) => pools[id].strat),
    STRAT_ABI,
    'wantLockedTotal',
    [],
    block,
    chain,
    web3,
  );

  const wantBalances = [];
  poolIDs.forEach((id) => {
    const balance = BigNumber(results[id] || 0);
    if (balance.isGreaterThan(0)) {
      wantBalances.push({
        token: pools[id].want,
        balance,
      });
    }
  });

  const tokenBalances = {};
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
