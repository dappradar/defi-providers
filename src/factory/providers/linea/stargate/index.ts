import util from '../../../../util/blockchainUtil';
import ABI from '../../../../constants/abi/stargateV1Abi.json';
import CONSTANTS from '../../../../constants/contracts.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import stargateV2 from '../../../../util/calculators/stargateV2';

const START_BLOCK = 48078;
const ROUTER = '0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590';
const BASE_TOKENS = {
  '0x224d8fd7ab6ad4c6eb4611ce56ef35dec2277f03': CONSTANTS.WMAIN_ADDRESS.linea,
};

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
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
      [
        Array.from(
          { length: allPoolsLength - store.pools.length },
          (_, i) => store.pools.length + i,
        ),
      ],
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

  const v2TokenBalances = await stargateV2.getV2Tvl(chain, block, web3);
  formatter.sumMultiBalanceOf(balances, v2TokenBalances);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
