import PROVIDER_ABI from './abis/provider.json';
import basicUtil from '../../../../util/basicUtil';
import TOKEN_ABI from './abis/token.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const ADDRESS_PROVIDERS = [
  '0xb17b674D9c5CB2e441F8e196a2f048A81355d031',
  '0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6',
  '0xA464e6DCda8AC41e03616F95f4BC98a13b8922Dc',
  '0x90f421832199e93d01b64DaF378b183809EB0988',
];

const AAVE_TOKENS = {
  '0x47afa96cdc9fab46904a55a6ad4bf6660b53c38a':
    '0xd586e7f844cea2f87f50152665bcbc2c279d8d70',
  '0x46a51127c3ce23fb7ab1de06226147f446e4a857':
    '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
  '0x532e6537fea298397212f09a61e03311686f548e':
    '0xc7198437980c041c805a1edcba50c1ce5db95118',
  '0x686bef2417b6dc32c50a3cbfbcc3bb60e1e9a15d':
    '0x50b7545627a5162f82a992c33b87adc75187b218',
  '0x53f7c5869a859f0aec3d334ee8b4cf01e3492f21':
    '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab',
};

const REN_TOKENS = {
  '0xeb9ac3e1c9c3f919804bdc412e0a39b94d4c09d3':
    '0xd586e7f844cea2f87f50152665bcbc2c279d8d70', // renDAI
  '0x0694bf58a4f48c5970454cd4874218eba843cf3e':
    '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab', // renETH
  '0x705bc47eba113be1a66e20824a05a176aa3b5265':
    '0x130966628846bfd36ff31a822705796e8cb8c18d', // renMIM
  '0x6e48a0c5386211837d99daca233f45ef5aa5f594':
    '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', // renUSDC
  '0xf55941e971302c634c586416c43469f3ead5ad3e':
    '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', // renUDST
};

const TOKENS = ['0x16a7da911a4dd1d83f3ff066fe28f3c792c50d90'];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 5254206) {
    return {};
  }

  let pools = { coins: {} };
  try {
    pools = await basicUtil.readFromCache('cache/pools.json', chain, provider);
  } catch {}

  const poolCounts = await util.executeCallOfMultiTargets(
    ADDRESS_PROVIDERS,
    PROVIDER_ABI,
    'pool_count',
    [],
    block,
    chain,
    web3,
  );

  const newProviderPools = [];
  ADDRESS_PROVIDERS.forEach((provider, index) => {
    if (poolCounts[index]) {
      if (!pools[provider]) {
        pools[provider] = {};
      }
      const newPools = Array.from({ length: poolCounts[index] }, (_, i) => i)
        .filter((i) => !pools[provider][i])
        .map((i) => [provider, i]);
      newProviderPools.push(...newPools);
    }
  });

  if (newProviderPools.length > 0) {
    const providerPools = await util.executeMultiCallsOfMultiTargets(
      newProviderPools.map((providerPool) => providerPool[0]),
      PROVIDER_ABI,
      'pool_list',
      newProviderPools.map((providerPool) => providerPool[1]),
      block,
      chain,
      web3,
    );

    providerPools.forEach((pool, index) => {
      if (pool) {
        pools[newProviderPools[index][0]][newProviderPools[index][1]] = pool;
      }
    });

    await basicUtil.saveIntoCache(pools, 'cache/pools.json', chain, provider);
  }

  if (!pools.coins) {
    pools.coins = {};
  }

  const tokens = {};
  const newTokens = [];
  ADDRESS_PROVIDERS.forEach((provider) => {
    Object.values(pools[provider]).forEach((token: any) => {
      if (pools.coins[token]) {
        tokens[token] = pools.coins[token];
      } else if (!tokens[token]) {
        newTokens.push(...Array.from({ length: 5 }, (_, i) => [token, i]));
        tokens[token] = {};
      }
    });
  });
  TOKENS.forEach((token) => {
    if (pools.coins[token]) {
      tokens[token] = pools.coins[token];
    } else if (!tokens[token]) {
      newTokens.push(...Array.from({ length: 5 }, (_, i) => [token, i]));
      tokens[token] = {};
    }
  });

  if (newTokens.length > 0) {
    const coins = await util.executeMultiCallsOfMultiTargets(
      newTokens.map((token) => token[0]),
      TOKEN_ABI,
      'coins',
      newTokens.map((token) => token[1]),
      block,
      chain,
      web3,
    );

    coins.forEach((coin, index) => {
      if (coin) {
        if (!pools.coins[newTokens[index][0]]) {
          pools.coins[newTokens[index][0]] = {};
        }
        pools.coins[newTokens[index][0]][newTokens[index][1]] = coin;
      }
    });

    await basicUtil.saveIntoCache(pools, 'cache/pools.json', chain, provider);
  }

  const coinBalanceCalls = [];
  Object.keys(tokens).forEach((token) => {
    if (pools.coins[token]) {
      Object.values(pools.coins[token]).forEach((coin) => {
        coinBalanceCalls.push([token, coin]);
      });
    }
  });

  const coinBalances = await util.getTokenBalancesOfHolders(
    coinBalanceCalls.map((call) => call[0]),
    coinBalanceCalls.map((call) => call[1]),
    block,
    chain,
    web3,
  );

  const totalSupplyResults = await util.getTokenTotalSupplies(
    Object.keys(AAVE_TOKENS),
    block,
    chain,
    web3,
  );
  const underlyingBalanceResults = await util.getTokenBalancesOfHolders(
    Object.keys(AAVE_TOKENS),
    Object.values(AAVE_TOKENS),
    block,
    chain,
    web3,
  );

  const aaveTokenTotalSupplies = {};
  const aaveTokenUnderlyingBalances = {};
  totalSupplyResults.forEach((result, index) => {
    if (result && underlyingBalanceResults[index]) {
      aaveTokenTotalSupplies[result.token] = result.totalSupply;
      aaveTokenUnderlyingBalances[result.token] =
        underlyingBalanceResults[index].balance;
    }
  });

  const underlyingBalances = [];
  coinBalances.forEach((result) => {
    if (result) {
      let balance = result;
      if (AAVE_TOKENS[result.token]) {
        balance = {
          token: AAVE_TOKENS[result.token],
          balance: aaveTokenUnderlyingBalances[result.token]
            .times(result.balance)
            .div(aaveTokenTotalSupplies[result.token]),
        };
      } else if (REN_TOKENS[result.token]) {
        balance = {
          token: REN_TOKENS[result.token],
          balance: result.balance,
        };
      }
      underlyingBalances.push(balance);
    }
  });

  const balances = {};
  formatter.sumMultiBalanceOf(balances, underlyingBalances);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
