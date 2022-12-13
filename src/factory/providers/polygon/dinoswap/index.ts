import MASTERCHEF_ABI from './abi.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';

const MASTERCHEF_ADDRESS = '0x1948abC5400Aa1d72223882958Da3bec643fb4E5';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 16858046) {
    return {};
  }

  const contract = new web3.eth.Contract(MASTERCHEF_ABI, MASTERCHEF_ADDRESS);

  let pools = [];
  try {
    pools = basicUtil.readDataFromFile('./pools.json', chain, provider);
  } catch {}

  let poolLength = 0;
  try {
    poolLength = await contract.methods.poolLength().call(null, block);
  } catch {}

  const newPools = await util.executeMultiCallsOfTarget(
    MASTERCHEF_ADDRESS,
    MASTERCHEF_ABI,
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
  await basicUtil.writeDataToFile(pools, './pools.json', chain, provider);
  const tokenBalances = {};

  const balanceResults = await util.getTokenBalances(
    MASTERCHEF_ADDRESS,
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
    web3,
  );
  return { balances };
}

export { tvl };
