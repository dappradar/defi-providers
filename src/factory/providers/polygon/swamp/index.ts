import BigNumber from 'bignumber.js';
import CHEF_ABI from './abi/abi.json';
import STRAT_ABI from './abi/strat.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';

const CHEF_ADDRESS = '0x4f04e540a51013afb6761ee73d71d2fb1f29af80';
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
  if (block < 16883557) {
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
    pools = basicUtil.readDataFromFile('./pools.json', chain, provider);
  } catch {}

  await Promise.all(poolIDs.map((id) => getWants(contract, id)));

  await basicUtil.writeDataToFile(pools, './pools.json', chain, provider);

  const results = await util.executeCallOfMultiTargets(
    poolIDs.map((id) => pools[id].strat),
    STRAT_ABI,
    'wantLockedTotal',
    [],
    block,
    chain,
    web3,
  );

  const balanceResults = [];
  poolIDs.forEach((id, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: pools[id].want,
        balance,
      });
    }
  });

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults);
  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );
  return { balances };
}

export { tvl };
