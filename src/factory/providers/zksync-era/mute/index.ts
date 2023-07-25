import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 95972;
const FACTORY_ADDRESS = '0x40be1cba6c5b47cdf9da7f963b6f761f4c60627d';
const STAKING_CONTRACT = '0x4336e06be4f62bd757c4248c48d4c0b32615a2df';
const MUTE_TOKEN = '0x0e97c7a0f8b2c9885c8ac9fc6136e829cbc21d42';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const { balances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  const stakingBalance = await util.getTokenBalances(
    STAKING_CONTRACT,
    [MUTE_TOKEN],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, stakingBalance, chain, provider);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
