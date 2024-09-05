import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const START_BLOCK = 2353671;
const V2_FACTORY_ADDRESS = '0x3E84D913803b02A4a7f027165E8cA42C14C0FdE7';
const ALB_ADDRESS = '0x1dd2d631c92b1aCdFCDd51A0F7145A50130050C4';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const tvl = await uniswapV2.getTvl(
    V2_FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  const tokenBalances = await util.getTokenBalancesOfEachHolder(
    [
      '0x52eaecac2402633d98b95213d0b473e069d86590',
      '0x365c6d588e8611125De3bEA5B9280C304FA54113',
    ],
    [ALB_ADDRESS],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(tvl.balances, tokenBalances);
  formatter.convertBalancesToFixed(tvl.balances);

  return { balances: tvl.balances, poolBalances: tvl.poolBalances };
}

export { tvl };
