import POOL_ABI from './abi.json';
import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';

const POOL_ADDRESSES = ['0x329239599afB305DA0A2eC69c58F8a6697F9F88d'];
let pools = {};

async function getPoolTokens(address, web3) {
  try {
    const contract = new web3.eth.Contract(POOL_ABI, address);
    if (!pools[address]) {
      pools[address] = [];
    }
    for (let id = pools[address].length; ; id += 1) {
      try {
        const token = await contract.methods.coins(id).call();
        pools[address].push(token.toLowerCase());
      } catch {
        break;
      }
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 5936381) {
    return {};
  }

  try {
    pools = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}
  await Promise.all(POOL_ADDRESSES.map((pool) => getPoolTokens(pool, web3)));
  basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  let poolList = [];
  let idList = [];
  POOL_ADDRESSES.forEach((address) => {
    poolList = poolList.concat(pools[address].map((token) => address));
    idList = idList.concat(pools[address].map((token, id) => id));
  });

  const results = await util.executeMultiCallsOfMultiTargets(
    poolList,
    POOL_ABI,
    'balances',
    idList.map((id) => [id]),
    block,
    chain,
    web3,
  );

  const balanceResults = [];

  poolList.forEach((address, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: pools[address][idList[index]],
        balance,
      });
    }
  });

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
