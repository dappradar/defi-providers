import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';


const START_BLOCK = 13195043;
const FACTORY_ADDRESS = '0x5f1D751F447236f486F4268b883782897A902379';
const BANK_ADDRESS = '0x1E16Aa4Bb965478Df310E8444CD18Fa56603A25F';
const FRTN_ADDRESS = '0xaf02d78f39c0002d14b95a3be272da02379aff21';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
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
    BANK_ADDRESS,
    [FRTN_ADDRESS],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, balanceResults, chain, provider);
  formatter.convertBalancesToFixed(balances);

  return { balances, poolBalances };
}

export { tvl };
