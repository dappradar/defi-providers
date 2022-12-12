import SUNNY_POOLS from './poolInfos.json';
import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

async function getMultipleAccountsRaw(accountsArray, web3) {
  if (
    !Array.isArray(accountsArray) ||
    accountsArray.length === 0 ||
    typeof accountsArray[0] !== 'string'
  ) {
    throw new Error('Expected accountsArray to be an array of strings');
  }

  const accountsInfo = await web3.eth.call('getMultipleAccounts', [
    accountsArray,
  ]);
  return accountsInfo.value;
}

async function getMultipleAccountBuffers(labeledAddresses, web3) {
  const labels = [];
  const addresses = [];
  for (const [label, address] of Object.entries(labeledAddresses)) {
    labels.push(label);
    addresses.push(address);
  }
  const accountsData = await getMultipleAccountsRaw(addresses, web3);

  const results = {
    sunnyPool: null,
    tokenAMint: null,
    tokenAReserve: null,
    tokenBReserve: null,
    lpTokenSPL: null,
  };
  accountsData.forEach((account, index) => {
    if (!account) {
      results[labels[index]] = null;
    } else {
      results[labels[index]] = Buffer.from(account.data[0], account.data[1]);
    }
  });

  return results;
}

async function genericSunnySaberPoolReader(pool, web3) {
  const accountData = await getMultipleAccountBuffers(
    pool.relevantAccounts,
    web3,
  );
  if (!accountData.sunnyPool) {
    return {};
  }

  const decimals = accountData.tokenAMint.readUInt8(44);
  const one = 10 ** decimals;

  const tokenA = pool.tokenA || pool.relevantAccounts.tokenAMint;
  const tokenB = pool.tokenB || pool.relevantAccounts.tokenBMint;
  const lpTokensInSunnyPool = BigNumber(
    accountData.sunnyPool.readBigUInt64LE(pool.offset),
  );
  const reserveAAmount = BigNumber(
    accountData.tokenAReserve.readBigUInt64LE(64),
  ).div(pool.tokenA ? one : 1);
  const reserveBAmount = BigNumber(
    accountData.tokenBReserve.readBigUInt64LE(64),
  ).div(pool.tokenB ? one : 1);
  const lpTokenTotalSupply = BigNumber(
    accountData.lpTokenSPL.readBigUInt64LE(36),
  );

  const sunnysShareOfSaber = lpTokensInSunnyPool.div(lpTokenTotalSupply);

  const poolTvlCoins = {};

  if (tokenA == tokenB) {
    poolTvlCoins[tokenA] = sunnysShareOfSaber.times(
      reserveAAmount.plus(reserveBAmount),
    );
  } else {
    poolTvlCoins[tokenA] = sunnysShareOfSaber.times(reserveAAmount);
    poolTvlCoins[tokenB] = sunnysShareOfSaber.times(reserveBAmount);
  }

  return poolTvlCoins;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  // a mapping of coin name to coin amount
  const balances = {};

  // Run these serially to avoid rate limiting issues
  const length = SUNNY_POOLS.length;
  for (let i = 0; i < length; i += 15) {
    const subPools = SUNNY_POOLS.slice(i, i + 15);
    const poolTVLs = await Promise.all(
      subPools.map((pool) => genericSunnySaberPoolReader(pool, web3)),
    );
    poolTVLs.forEach((poolTVL) => {
      for (const [tokenId, balance] of Object.entries(poolTVL)) {
        if (!balances[tokenId]) {
          balances[tokenId] = balance;
        } else {
          balances[tokenId] = balances[tokenId].plus(balance);
        }
      }
    });
  }

  for (const token in balances) {
    balances[token] = balances[token].toFixed();
  }
  return { balances };
}

export { tvl };
