import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import ABI from '../../../../constants/abi/fulcrom.json';

const START_BLOCK = 14743823;
const VAULT_ADDRESS = '0x7d5b0215EF203D0660BC37d5D09d964fd6b55a1E';

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
    await basicUtil.saveIntoCache(tokens, 'cache/tokens.json', chain, provider);
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
