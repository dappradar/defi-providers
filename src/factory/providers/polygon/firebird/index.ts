import uniswapV2 from '../../../../util/calculators/uniswapV2';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import BigNumber from 'bignumber.js';

const FACTORY_ADDRESS = '0x5De74546d3B86C8Df7FEEc30253865e1149818C8';
const STABLE_POOL = '0x01C9475dBD36e46d1961572C8DE24b74616Bae9e';
const STABLE_POOL_TOKENS = [
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 15139510) {
    return {};
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  const balanceResults = await util.getTokenBalances(
    STABLE_POOL,
    STABLE_POOL_TOKENS,
    block,
    chain,
    web3,
  );

  balanceResults.forEach((result) => {
    if (result && result.balance.isGreaterThan(0)) {
      const address = result.token;
      if (!balances[address]) {
        balances[address] = '0';
      }
      balances[address] = BigNumber(balances[address])
        .plus(result.balance)
        .toFixed();
    }
  });

  console.timeEnd('Getting PairInfo');

  for (const token in balances) {
    if (BigNumber(balances[token]).isLessThan(100000)) {
      delete balances[token];
    } else {
      balances[token] = BigNumber(balances[token]).toFixed();
    }
  }

  return { balances, poolBalances };
}

export { tvl };
