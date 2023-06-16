import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import ABI from './abi.json';

const START_BLOCK = 7154232;
const VAULT_ADDRESS = '0x8c7ef34aa54210c76d6d5e475f43e0c11f876098';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  let tokens = [];
  try {
    tokens = await basicUtil.readFromCache(
      'cache/tokens.json',
      chain,
      provider,
    );
  } catch {}

  const whitelistedTokenCount = await util.executeCall(
    VAULT_ADDRESS,
    ABI,
    'whitelistedTokenCount',
    [],
    block,
    chain,
    web3,
  );

  if (tokens.length < whitelistedTokenCount) {
    const newTokens = await util.executeMultiCallsOfTarget(
      VAULT_ADDRESS,
      ABI,
      'whitelistedTokens',
      Array.from(Array(whitelistedTokenCount - tokens.length), (_, i) => [
        i + tokens.length,
      ]),
      block,
      chain,
      web3,
    );

    tokens = [...tokens, ...newTokens];
    basicUtil.savedIntoCache(tokens, 'cache/tokens.json', chain, provider);
  }

  const tokenBalances = await util.getTokenBalances(
    VAULT_ADDRESS,
    tokens,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
