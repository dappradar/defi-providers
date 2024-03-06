import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';

const DEEP_FREEZERS_ADDRESS = 'KT1LjcQ4h5hCy9RcveFz9Pq8LtmF6oun7vNd';

const FARM_ADDRESSES = [
  'KT1KnuE87q1EKjPozJ5sRAjQA24FPsP57CE3',
  'KT1L1WZgdsfjEyP5T4ZCYVvN5vgzrNbu18kX',
];

const WTZ_ADDRESSES = [
  'KT1BB3oNr5vUSw1CuPNb2zpYEVp376XrXWaJ',
  'KT1H25LW5k4HQGm9hmNXzaxf3nqjsAEhQPah',
  'KT1LpGZnT6dj6STSxHXmvSPqx39ZdPXAMpFz',
  'KT1NBgqqJacbdoeNAg9MvrgPT9h6q6AGWvFA',
  'KT1NGTDBKDPMrAYEufb72CLwuQJ7jU7jL6jD',
];

async function getTezosBalance(address, block, web3) {
  try {
    const tezosBalance = await web3.eth.getBalance(address, block);

    return {
      token: 'xtz',
      balance: BigNumber(tezosBalance),
    };
  } catch {}
  return null;
}

let pools = {};

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 1521051) {
    return {};
  }

  try {
    pools = await basicUtil.readFromCache('cache/pools.json', chain, provider);
  } catch {}

  const balanceResults = [];
  let globalIndex = 0;

  for (let i = 0; i < FARM_ADDRESSES.length; i++) {
    const contract = new web3.eth.Contract(null, FARM_ADDRESSES[i]);
    await contract.init();

    const farms = await contract.methods.getBigmap('farms').call(null, block);
    const totalFarms = farms.map((farm) => farm.key);
    const farmLength = totalFarms.length;

    console.log(`Farm length for address ${FARM_ADDRESSES[i]}: ${farmLength}`);
    try {
      for (let j = 0; j < farmLength; j++) {
        const farmIndex = j + i * globalIndex;

        if (!pools[farmIndex]) {
          let tokenId;
          try {
            const tokenType = Object.keys(farms[j].value.poolToken.tokenType);
            if (tokenType[0] == 'fa2') {
              tokenId = farms[j].value.poolToken.tokenId;
            }
          } catch {}
          pools[farmIndex] = tokenId
            ? `${farms[j].value.poolToken.address}_${tokenId}`
            : farms[j].value.poolToken.address;
        }

        balanceResults.push({
          token: pools[farmIndex],
          balance: BigNumber(farms[j].value.poolBalance),
        });
      }
      globalIndex += farmLength;
    } catch {}
  }


  // Fetch WTZ Liquid Staking
  for (let i = 0; i < WTZ_ADDRESSES.length; i++) {
    const wtzIndex = i + globalIndex;
    pools[wtzIndex] = WTZ_ADDRESSES[i];
    const wtz = await getTezosBalance(WTZ_ADDRESSES[i], block, web3);
    balanceResults.push(wtz);
  }
  globalIndex += WTZ_ADDRESSES.length;


  // Fetch Deep Freezers TVL
  const contract = new web3.eth.Contract(null, DEEP_FREEZERS_ADDRESS);
  await contract.init();

  const locks = await contract.methods.getBigmap('locks').call(null, block);
  const totalLocks = locks.map((lock) => lock.key);
  const locksLength = totalLocks.length;

  console.log(
    `Lock length for address $DEEP_FREEZERS_ADDRESS}: ${locksLength}`,
  );
  try {
    for (let i = 0; i < locksLength; i++) {
      const lockIndex = i + globalIndex;

      if (!pools[lockIndex]) {
        let tokenId;
        try {
          const tokenType = Object.keys(locks[i].value.token.tokenType);
          if (tokenType[0] == 'fa2') {
            tokenId = locks[i].value.token.tokenId;
          }
        } catch {}
        pools[lockIndex] = tokenId
          ? `${locks[i].value.token.address}_${tokenId}`
          : locks[i].value.token.address;
      }

      balanceResults.push({
        token: pools[lockIndex],
        balance: BigNumber(locks[i].value.amountLocked),
      });
    }
    globalIndex += Number(locksLength);
  } catch {}
  
  await basicUtil.saveIntoCache(pools, 'cache/pools.json', chain, provider);

  const tokenBalances = {};

  formatter.sumMultiBalanceOf(tokenBalances, balanceResults, chain, provider);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );

  return { balances };
}

export { tvl };
