import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';

const START_BLOCK = 95972;
const FACTORY_ADDRESS = '0x529Bd7Fc43285B96f1e8d5158626d1F15bb8A834';
const STAKING_CONTRACT = '0x1925AB9F9bcdB9E2D2861cc7C4c157645126D9d9';
const VS_TOKEN = '0x5756A28E2aAe01F600FC2C01358395F5C1f8ad3A';
const swapToken = {
  //BUSD
  '0x2039bb4116b4efc145ec4f0e2ea75012d6c0f181': {
    sourceDecimal: 18,
    targetAddress: '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4',
    targetDecimal: 6,
  },
  //sIUSDT
  '0x496d88d1efc3e145b7c12d53b78ce5e7eda7a42c': {
    sourceDecimal: 18,
    targetAddress: '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4',
    targetDecimal: 6,
  },
  //iUSD
  '0x1382628e018010035999a1ff330447a0751aa84f': {
    sourceDecimal: 18,
    targetAddress: '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4',
    targetDecimal: 6,
  },
  '0xd90764041da2720396863836e9f78ddaee140533': {
    sourceDecimal: 18,
    targetAddress: 'coingecko_wtbt',
    targetDecimal: 0,
  },
};

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
    [VS_TOKEN],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, stakingBalance, chain, provider);

  formatter.convertBalancesToFixed(balances);

  formatter.swapTokenAddresses(balances, swapToken);
  return { balances: balances, poolBalances };
}

export { tvl };
