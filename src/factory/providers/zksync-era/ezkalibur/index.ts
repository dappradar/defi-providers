import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 4161037;
const FACTORY_ADDRESS = '0x15c664a62086c06d43e75bb3fdded93008b8ce63';
const STAKING_CONTRACT = '0x11ef47783740b3f0c9736d54be8ef8953c3ead99';
const SWORD_TOKEN = '0x240f765af2273b0cab6caff2880d6d8f8b285fa4';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
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
    [SWORD_TOKEN],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, stakingBalance, chain, provider);
  formatter.convertBalancesToFixed(balances);

  return { balances, poolBalances };
}

export { tvl };
