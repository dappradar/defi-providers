import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const START_BLOCK = 1768897;
const V3_START_BLOCK = 1768897;
const V2_FACTORY_ADDRESS = '0xAAA16c016BF556fcD620328f0759252E29b1AB57';
const V3_FACTORY_ADDRESS = '0xAAA32926fcE6bE95ea2c51cB4Fcb60836D320C42';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  let balances = {};

  const v2 = await uniswapV2.getTvl(
    V2_FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  if (block >= V3_START_BLOCK) {
    balances = await uniswapV3.getTvl(
      V3_FACTORY_ADDRESS,
      V3_START_BLOCK,
      block,
      chain,
      provider,
      web3,
    );
  }

  balances = formatter.sum([v2.balances, balances]);

  const tokenBalances = await util.getTokenBalances(
    '0xAAAEa1fB9f3DE3F70E89f37B69Ab11B47eb9Ce6F',
    ['0xAAAac83751090C6ea42379626435f805DDF54DC8'],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);

  return { balances };
}

export { tvl };
