import FACTORY_ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const FACTORY_ADDRESS = '0xBD530a1c060DC600b951f16dc656E4EA451d1A2D';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11395074) {
    return {};
  }

  const contract = new web3.eth.Contract(FACTORY_ABI, FACTORY_ADDRESS);

  let pools = [];
  try {
    pools = await basicUtil.readFromCache('cache/pools.json', chain, provider);
  } catch {}

  let poolLength = 0;
  try {
    poolLength = await contract.methods.poolLength().call(null, block);
  } catch {}

  const newPools = await util.executeMultiCallsOfTarget(
    FACTORY_ADDRESS,
    FACTORY_ABI,
    'poolInfo',
    Array.from({ length: poolLength - pools.length }, (v, i) => [
      pools.length + i,
    ]),
    block,
    chain,
    web3,
  );

  for (const pool of newPools) {
    if (pool) {
      pools.push(pool.lpToken.toLowerCase());
    } else {
      break;
    }
  }

  await basicUtil.saveIntoCache(pools, 'cache/pools.json', chain, provider);

  const tokenBalances = {};

  const balanceResults = await util.getTokenBalances(
    FACTORY_ADDRESS,
    pools,
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults);

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
