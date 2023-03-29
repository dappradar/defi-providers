import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const TREASURY = '0x8CFA87aD11e69E071c40D58d2d1a01F862aE01a8';
const TOKENS = [
  '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
  '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
  '0xfa5a5f0bc990be1d095c5385fff6516f6e03c0a7',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 20740234) {
    return {};
  }

  const tokenBalances = await util.getTokenBalances(
    TREASURY,
    TOKENS,
    block,
    chain,
    web3,
  );

  const treasuryBalances = {};
  formatter.sumMultiBalanceOf(treasuryBalances, tokenBalances, chain, provider);

  const balances = await util.convertToUnderlyings(
    treasuryBalances,
    block,
    chain,
    provider,
    web3,
  );

  return { balances };
}

export { tvl };
