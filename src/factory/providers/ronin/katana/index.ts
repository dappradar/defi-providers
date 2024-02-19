import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';

const KATANA_UNI = '0xb255d6a720bb7c39fee173ce22113397119cb930';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 7860907) {
    return {};
  }
  const { balances, poolBalances } = await uniswapV2.getTvl(
    KATANA_UNI,
    block,
    chain,
    provider,
    web3,
  );
  formatter.convertBalancesToFixed(balances);
  return { balances, poolBalances };
}

export { tvl };
