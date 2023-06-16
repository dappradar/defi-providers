import basicUtil from '../../../../util/basicUtil';
import CHEF_ABI from './abi.json';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const CHEF_ADDRESS = '0x66c901fEBc771A8e0bbe0a9f8A2487C60ba07bf4';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 7911418) {
    return {};
  }

  const contract = new web3.eth.Contract(CHEF_ABI, CHEF_ADDRESS);
  let poolLength;
  try {
    poolLength = await contract.methods.poolLength().call(null, block);
  } catch {
    return {};
  }

  let pools = [];
  try {
    pools = await basicUtil.readDataFromFile(
      'cache/pools.json',
      chain,
      provider,
    );
  } catch {}

  for (let first = pools.length; first < poolLength; first += 300) {
    const last = Math.min(poolLength, first + 300);
    const poolCalls = [];
    for (let start = first; start < last; start += 1) {
      poolCalls.push(contract.methods.poolInfo(start).call());
    }
    try {
      const poolResults = await Promise.all(poolCalls);
      poolResults.forEach((result) => {
        pools.push(result.lpToken);
      });
    } catch {
      break;
    }
  }

  basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  const tokenBalances = {};
  poolLength = pools.length;
  for (let first = 0; first < poolLength; first += 100) {
    const last = Math.min(poolLength, first + 100);
    const balanceResults = await util.getTokenBalances(
      CHEF_ADDRESS,
      pools.slice(first, last),
      block,
      chain,
      web3,
    );

    formatter.sumMultiBalanceOf(tokenBalances, balanceResults, chain, provider);
  }

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
