import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 13905487;
const POOL = '0xD8b19613723215EF8CC80fC35A1428f8E8826940';
const TOKENS = [
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0x0abdace70d3790235af448c88547603b945604ea', // DNT
  '0x4e15361fd6b4bb609fa63c81a2be19d873717870', // FTM
  '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', // MATIC
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const tokenBalances = await util.getTokenBalances(
    POOL,
    TOKENS,
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
