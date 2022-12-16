import BigNumber from 'bignumber.js';
import abi from './abi/v2abi.json';
import getBalancesBulk from './abi/getBalancesBulk.json';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { web3 } from '@project-serum/anchor';
import basicUtil from '../../../../util/basicUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

/*==================================================
  Settings
  ==================================================*/

const DISPATCHER = '0xC3DC853dD716bd5754f421ef94fdCbac3902ab32';
const HELPER_BALANCES = '0xb173393e08496209ad1cd9d57c769de76bdcea5a';
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
    typeof log === 'string'
      ? log.toLowerCase()
      : `0x${log.data.slice(64 - 40 + 2, 64 + 2)}`.toLowerCase(),
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

  const tempholders = [];
  const temptokens = [];
  const multiTokenBalances = [];
  let i,
    j,
    // eslint-disable-next-line prefer-const
    chunk = 50;
  for (i = 0, j = proxyInfo.length; i < j; i += chunk) {
    const tempProxyInfo = proxyInfo.slice(i, i + chunk);
    multiTokenBalances.push(
      await util.getTokenBalancesOfHolders(
        tempProxyInfo.map((info) => info.holder),
        tempProxyInfo.map((info) => info.token),
        block,
        chain,
        web3,
      ),
    );
    // tempholders.push(tempProxyInfo.map((info) => info.holder));
    // temptokens.push(tempProxyInfo.map((info) => info.token));

    // tokenBalanceCalls.push({
    //   target: HELPER_BALANCES,
    //   params: [tempholders, temptokens],
    // });
  }

  console.log('[v2] getting token balances');
  // const multiTokenBalances = await util.getTokenBalancesOfHolders(
  //   mergedArrayHolder,
  //   mergedArrayTokens,
  //   block,
  //   chain,
  //   web3,
  // );

  const balanceOfResult = [];
  multiTokenBalances.forEach(function (tokenBalance) {
    balanceOfResult.push(...tokenBalance);
  });

  /* combine token volumes on multiple funds */
  const tokenBalances = {};
  balanceOfResult.forEach((result) => {
    if (result && result.token_address && result.balance) {
      const balance = BigNumber(result.balance);
      if (Number(balance) <= 0) return;

      const asset = result.token_address.toLowerCase();
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
