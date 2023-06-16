import fs from 'fs';
import BigNumber from 'bignumber.js';
import FACTORY_ABI from './abi/abi.json';
import PTOKEN_ABI from './abi/ptoken.json';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';

const FACTORY_ADDRESS = '0x0C8c1ab017c3C0c8A48dD9F1DB2F59022D190f0b';
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
let ptokens = {};

async function getUnderlyings(address, block, web3) {
  try {
    if (!ptokens[address]) {
      const contract = new web3.eth.Contract(PTOKEN_ABI, address);
      try {
        const token = await contract.methods.underlying().call(null, block);
        ptokens[address] = token.toLowerCase();
      } catch {
        ptokens[address] = WETH_ADDRESS;
      }
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11645185) {
    return {};
  }

  try {
    ptokens = await basicUtil.readFromCache(
      'cache/pools.json',
      chain,
      provider,
    );
  } catch {}

  const contract = new web3.eth.Contract(FACTORY_ABI, FACTORY_ADDRESS);
  const markets = await contract.methods.getAllMarkets().call(null, block);
  await Promise.all(
    markets.map((market) => getUnderlyings(market, block, web3)),
  );
  await basicUtil.savedIntoCache(ptokens, 'cache/pools.json', chain, provider);

  const results = await util.executeCallOfMultiTargets(
    markets,
    PTOKEN_ABI,
    'getCash',
    [],
    block,
    chain,
    web3,
  );

  const balanceResults = [];

  markets.forEach((market, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: ptokens[market],
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
