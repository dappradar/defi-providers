import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';
import {
  ITvlParams,
  ITvlBalancesReturn,
  ITvlBalancesPoolBalancesReturn,
} from '../../../../interfaces/ITvl';

const START_BLOCK = 54459864;
const FACTORY_ADDRESS = '0x7928D4FeA7b2c90C732c10aFF59cf403f0C38246';

async function tvl(
  params: ITvlParams,
): Promise<
  ITvlBalancesReturn | ITvlBalancesPoolBalancesReturn | Record<string, never>
> {
  const { block, chain, provider } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
  );

  formatter.convertBalancesToFixed(balances);

  return { balances, poolBalances };
}

export { tvl };
