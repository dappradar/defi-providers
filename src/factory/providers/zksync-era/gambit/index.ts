import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';

const START_BLOCK = 10005110;
const SimpleGToken = '0x0729e806f57CE71dA4464c6B2d313E517f41560b'; // SimpleGToken
const Treasury = '0x1fb8611064a09469F808263C398623A86e7Aa883'; // Treasury

const USDC_TOKEN = '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4'; // USDC

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const tokenBalances = await Promise.all([
    util.getTokenBalances(SimpleGToken, [USDC_TOKEN], block, chain, web3),
    util.getTokenBalances(Treasury, [USDC_TOKEN], block, chain, web3),
  ]);

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances[0]);
  formatter.sumMultiBalanceOf(balances, tokenBalances[1]);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
