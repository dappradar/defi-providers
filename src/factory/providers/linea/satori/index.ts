import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 156461;
const STAKING_ADDRESSES = [
  '0xfb371E70eEB32f4054F40514924e77213ca18425',
  '0xF96116e124eB3F62Ddc6a9cfbdc58d7F8A37c50A',
];
const USDC_ADDRESS = '0x176211869ca2b568f2a7d4ee941e073a821ee1ff';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const proxyBalance = await util.getTokenBalancesOfEachHolder(
    STAKING_ADDRESSES,
    [USDC_ADDRESS],
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, proxyBalance, chain, provider);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
