import util from '../../../../util/blockchainUtil';
import ABI from './abi.json';
import CONSTANTS from '../../../../constants/contracts.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';

const ROUTER = '0x8731d54E9D02c286767d56ac03e8037C07e01e98';
const BASE_TOKENS = {
  '0x72e2f4830b9e45d52f80ac08cb2bec0fef72ed9c':
    CONSTANTS.WMAIN_ADDRESS.ethereum,
};

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 14402864) {
    return {};
  }

  let store = {
    pools: [],
    tokens: {},
  };
  try {
    store = await basicUtil.readFromCache('cache/store.json', chain, provider);
  } catch {}

  const factory = await util.executeCall(
    ROUTER,
    ABI,
    'factory',
    [],
    block,
    chain,
    web3,
  );

  const allPoolsLength = await util.executeCall(
    factory,
    ABI,
    'allPoolsLength',
    [],
    block,
    chain,
    web3,
  );

  if (store.pools.length < allPoolsLength) {
    const newPools = await util.executeMultiCallsOfTarget(
      factory,
      ABI,
      'allPools',
      Array.from(
        { length: allPoolsLength - store.pools.length },
        (_, i) => store.pools.length + i,
      ),
      block,
      chain,
      web3,
    );
    const poolTokens = await util.executeCallOfMultiTargets(
      newPools,
      ABI,
      'token',
      [],
      block,
      chain,
      web3,
    );

    for (const index in newPools) {
      if (newPools[index] && poolTokens[index]) {
        store.pools.push(newPools[index]);
        store.tokens[newPools[index]] = poolTokens[index];
      } else {
        break;
      }
    }
    await basicUtil.saveIntoCache(store, 'cache/store.json', chain, provider);
  }

  const tokenBalances = await util.getTokenBalancesOfHolders(
    Object.keys(store.tokens),
    Object.values(store.tokens),
    block,
    chain,
    web3,
  );
  tokenBalances.forEach((tokenBalance) => {
    if (tokenBalance && BASE_TOKENS[tokenBalance.token]) {
      tokenBalance.token = BASE_TOKENS[tokenBalance.token];
    }
  });

  const balances = {};

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
