import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const STAKING_ADDRESS = '0x2d615795a8bdb804541C69798F13331126BA0c09';
const TOKENS = [
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
  '0x0391d2021f89dc339f60fff84546ea23e337750f',
  '0xc00e94cb662c3520282e6f5717214004a7f26888',
  '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
  '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
  '0x514910771af9ca656af840dff83e8264ecf986ca',
  '0x767fe9edc9e0df98e07454847909b5e959d7ca0e',
  '0xbbbdb106a806173d1eea1640961533ff3114d69a',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < 12503000) {
    return {};
  }

  const balanceResults = await util.getTokenBalances(
    STAKING_ADDRESS,
    TOKENS,
    block,
    chain,
    web3,
  );

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );
  return { balances };
}
export { tvl };
