import basicUtil from '../../../../util/basicUtil';
import VENUS_ABI from './abi.json';
import VENUSTOKEN_ABI from './token.json';
import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const comptrollerAddress = '0xfD36E2c2a6789Db23113685031d7F16329158384';
const vBNBAddress = '0xa07c5b74c9b40447a954e1466938b865b6bbea36';
const wBNBAddress = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
let pools = {};

async function getUnderlyings(market, web3) {
  try {
    if (!pools[market]) {
      const marketContract = new web3.eth.Contract(VENUSTOKEN_ABI, market);
      let underlying;
      if (market.toLowerCase() === vBNBAddress) {
        underlying = wBNBAddress;
      } else {
        underlying = await marketContract.methods.underlying().call();
        underlying = underlying.toLowerCase();
      }
      pools[market] = underlying;
    }
  } catch {
    return null;
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 2775724) {
    return {};
  }

  const contract = new web3.eth.Contract(VENUS_ABI, comptrollerAddress);
  const markets = await contract.methods.getAllMarkets().call(null, block);

  try {
    pools = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  await Promise.all(markets.map((market) => getUnderlyings(market, web3)));

  basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  const results = await util.executeCallOfMultiTargets(
    markets,
    VENUSTOKEN_ABI,
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
        token: pools[market],
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
