import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import ABI from '../../../../constants/abi/stargateV1Abi.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import stargateV2 from '../../../../util/calculators/stargateV2';

const ROUTER = '0x45A01E4e04F14f7A4a6702c74187c5F6222033cd';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 12215178) {
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

  const balances = {};

  formatter.sumMultiBalanceOf(balances, tokenBalances);

  const v2TokenBalances = await stargateV2.getV2Tvl(chain, block, web3);
  formatter.sumMultiBalanceOf(balances, v2TokenBalances);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
