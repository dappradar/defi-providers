import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const START_BLOCK = 173814;
const V3_START_BLOCK = 2649801;
const V2_FACTORY_ADDRESS = '0x68A384D826D3678f78BB9FB1533c7E9577dACc0E';
const V3_FACTORY_ADDRESS = '0xabe1655110112d0e45ef91e94f8d757e4ddba59c';
const STELLA_ADDRESS = '0x0e358838ce72d5e61e0018a2ffac4bec5f4c88d2';
const XSTELLA_ADDRESS = '0x06a3b410b681c82417a906993acefb91bab6a080';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  let { balances, poolBalances } = await uniswapV2.getTvl(
    V2_FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  const tokenBalance = await util.getTokenBalances(
    XSTELLA_ADDRESS,
    [STELLA_ADDRESS],
    block,
    chain,
    web3,
  );

  let v3balances = {};
  if (block >= V3_START_BLOCK) {
    v3balances = await uniswapV3.getTvl(
      V3_FACTORY_ADDRESS,
      V3_START_BLOCK,
      block,
      chain,
      provider,
      web3,
      'algebra',
    );
  }

  balances = formatter.sum([v3balances, balances]);
  formatter.sumMultiBalanceOf(balances, tokenBalance);
  formatter.convertBalancesToFixed(balances);

  return { balances, poolBalances };
}

export { tvl };
