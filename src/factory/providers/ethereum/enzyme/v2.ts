import BigNumber from 'bignumber.js';
import abi from './abi/v2abi.json';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import { ITvlParams } from '../../../../interfaces/ITvl';

const DISPATCHER = '0xC3DC853dD716bd5754f421ef94fdCbac3902ab32';
const START_BLOCK = 11636493;

async function tvl(params: ITvlParams): Promise<any[]> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return [];
  }

  let _v2Vaults;
  try {
    _v2Vaults = basicUtil.readDataFromFile('v2Vaults.json', chain, provider);
  } catch {
    _v2Vaults = {
      start: START_BLOCK,
      proxies: [],
    };
  }

  /* pull melon fund holding addresses */
  const logs = (
    await util.getLogs(
      Math.max(_v2Vaults.start, START_BLOCK),
      block,
      '0xa50560b448ad796ef60adfeffe1c19ed34daf94c2aa6905d0e209017dbc19f58',
      DISPATCHER,
      web3,
    )
  ).output;

  const vaultProxies = logs.map((log) =>
    `0x${log.data.slice(64 - 40 + 2, 64 + 2)}`.toLowerCase(),
  );

  const holdingTokensResults = await util.executeCallOfMultiTargets(
    vaultProxies,
    [abi['getTrackedAssets']],
    'getTrackedAssets',
    [],
    block,
    chain,
    web3,
  );

  const proxyResults = _v2Vaults.proxies;
  vaultProxies.forEach((proxy, index) => {
    if (holdingTokensResults[index]) {
      proxyResults.push({
        holder: proxy,
        tokens: holdingTokensResults[index],
      });
    }
  });

  basicUtil.writeDataToFile(
    {
      start: block,
      proxies: proxyResults,
    },
    'v2Vaults.json',
    chain,
    provider,
  );
  /* supported tokens */
  const proxyInfo = proxyResults
    .map((result) =>
      result.tokens.map((token) => ({ token: token, holder: result.holder })),
    )
    .reduce((a, b) => a.concat(b), []);

  const callParams = [];
  let i, j, tempholders, temptokens;
  const chunk = 50;
  const balanceOfResult = [];

  for (i = 0, j = proxyInfo.length; i < j; i += chunk) {
    const tempProxyInfo = proxyInfo.slice(i, i + chunk);
    tempholders = tempProxyInfo.map((info) => info.holder);
    temptokens = tempProxyInfo.map((info) => info.token);

    callParams.push([tempholders, temptokens]);
    const multiTokenBalances = await util.getTokenBalancesOfHolders(
      tempholders,
      temptokens,
      block,
      chain,
      web3,
    );
    multiTokenBalances.forEach(function (tokenBalance) {
      balanceOfResult.push(tokenBalance);
    });
  }

  /* combine token volumes on multiple funds */
  const tokenBalances = {};
  balanceOfResult.forEach((result) => {
    if (result && result.token && result.balance) {
      const balance = BigNumber(result.balance);
      if (balance.lte(0)) return;

      const asset = result.token.toLowerCase();
      const total = tokenBalances[asset];

      if (total) {
        tokenBalances[asset] = balance.plus(total);
      } else {
        tokenBalances[asset] = balance;
      }
    }
  });

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );
  const results = [];

  for (const token in balances) {
    results.push({
      token,
      balance: BigNumber(balances[token]),
    });
  }

  return results;
}

export { tvl };
