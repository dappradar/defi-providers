import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 464690;
const FACTORY_ADDRESS = '0xe140eac2bb748c8f456719a457f26636617bb0e9';
const STAKING_CONTRACT = '0xbde345771eb0c6adebc54f41a169ff6311fe096f';
const VELOCORE_TOKEN = '0x85d84c774cf8e9ff85342684b0e795df72a24908';

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

  const stakingBalance = await util.getTokenBalances(
    STAKING_CONTRACT,
    [VELOCORE_TOKEN],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, stakingBalance, chain, provider);
  formatter.convertBalancesToFixed(balances);

  return { balances, poolBalances };
}

export { tvl };
