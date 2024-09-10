import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 2631214;
const FACTORY_ADDRESS = '0x71524B4f93c58fcbF659783284E38825f0622859';

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

  formatter.convertBalancesToFixed(balances);
  delete balances['0x7f12d13b34f5f4f0a9449c16bcd42f0da47af200']; // token was migrated to another address
  return { balances, poolBalances };
}

export { tvl };
