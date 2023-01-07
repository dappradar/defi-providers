import util from '../../../../util/blockchainUtil';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 56428000;
const FACTORY_ADDRESS = '0xc66f594268041db60507f00703b152492fb176e7';
const STABLE_POOLS = [
  '0x458459e48dbac0c8ca83f8d0b7b29fefe60c3970',
  '0x13e7a001ec72ab30d66e2f386f677e25dcff5f59',
];
const TOKENS = [
  '0x5183e1b1091804bc2602586919e6880ac1cf2896',
  '0x4988a896b1227218e4a686fde5eabdcabd91571f',
  '0xb12bfca5a55806aaf64e99521918a4bf0fc40802',
];

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

  const stablePools Balances = await util.getTokenBalancesOfEachHolder(
    STABLE_POOLS,
    TOKENS,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, stablePoolsBalances);
  formatter.convertBalancesToFixed(balances);

  return { balances, poolBalances };
}

export { tvl };
