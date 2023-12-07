import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BUCKETS_FACTORY_ABI from './abi/bucketsFactory.json';
import BUCKET_ABI from './abi/bucket.json';
import request from 'graphql-request';
import {
  AAVE_TOKENS,
  BUCKETS_FACTORY_ADDRESS,
  DEFAULT_TOKENS,
  GRAPHQL_API,
  POSITION_MANAGER_ADDRESS,
  START_BLOCK,
  TRADER_BALANCE_VAULT_ADDRESS,
  CLOSE_POSITIONS_VOLUMES_QUERY,
  OPEN_POSITIONS_VOLUMES_QUERY,
  PARTIALLY_CLOSE_POSITIONS_VOLUMES_QUERY,
  SWAP_VOLUMES_QUERY,
  QUERY_SIZE,
} from './utils';
import BigNumber from 'bignumber.js';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const bucketsFactoryContract = new web3.eth.Contract(
    BUCKETS_FACTORY_ABI,
    BUCKETS_FACTORY_ADDRESS,
  );
  try {
    const buckets: string[] = await bucketsFactoryContract.methods
      .allBuckets()
      .call(null, block);

    for (let i = 0; i < buckets.length; i++) {
      try {
        const bucketContract = new web3.eth.Contract(BUCKET_ABI, buckets[i]);
        const borrowedAsset: string = await bucketContract.methods
          .borrowedAsset()
          .call();
        const aToken = AAVE_TOKENS[borrowedAsset.toLowerCase()];

        const bucketBalance = await util.getTokenBalances(
          buckets[i],
          [borrowedAsset, aToken].filter((t) => t),
          block,
          chain,
          web3,
        );

        formatter.sumMultiBalanceOf(balances, bucketBalance);
      } catch {}
    }
  } catch {}

  const defaultTokens = Object.values(DEFAULT_TOKENS);

  try {
    const positionManagerBalance = await util.getTokenBalances(
      POSITION_MANAGER_ADDRESS,
      defaultTokens,
      block,
      chain,
      web3,
    );
    formatter.sumMultiBalanceOf(balances, positionManagerBalance);
  } catch {}
  try {
    const traderBalanceVaultBalance = await util.getTokenBalances(
      TRADER_BALANCE_VAULT_ADDRESS,
      defaultTokens,
      block,
      chain,
      web3,
    );
    formatter.sumMultiBalanceOf(balances, traderBalanceVaultBalance);
  } catch {}

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

async function getTokenVolumes(params) {
  const { web3, block } = params;

  const { timestamp } = await web3.eth.getBlock(block);

  const fromTimestamp = (timestamp - 60 * 60 * 24).toString();
  const toTimestamp = timestamp.toString();

  const tokenVolumes = {};

  const spotSwaps = [];
  const openPositions = [];
  const closePositions = [];
  const partialClosePositions = [];

  for (let i = 0; ; i++) {
    const { spotSwaps: data } = await request(
      GRAPHQL_API,
      SWAP_VOLUMES_QUERY(i * QUERY_SIZE),
      {
        fromTimestamp,
        toTimestamp,
      },
    ).then((res) => res);

    spotSwaps.push(...data);

    if (data.length < QUERY_SIZE) break;
  }

  for (let i = 0; ; i++) {
    const { openPositions: data } = await request(
      GRAPHQL_API,
      OPEN_POSITIONS_VOLUMES_QUERY(i * QUERY_SIZE),
      {
        fromTimestamp,
        toTimestamp,
      },
    ).then((res) => res);

    openPositions.push(...data);

    if (data.length < QUERY_SIZE) break;
  }
  for (let i = 0; ; i++) {
    const { closePositions: data } = await request(
      GRAPHQL_API,
      CLOSE_POSITIONS_VOLUMES_QUERY(i * QUERY_SIZE),
      {
        fromTimestamp,
        toTimestamp,
      },
    ).then((res) => res);

    closePositions.push(...data);

    if (data.length < QUERY_SIZE) break;
  }
  for (let i = 0; ; i++) {
    const { partialClosePositions: data } = await request(
      GRAPHQL_API,
      PARTIALLY_CLOSE_POSITIONS_VOLUMES_QUERY(i * QUERY_SIZE),
      {
        fromTimestamp,
        toTimestamp,
      },
    ).then((res) => res);

    partialClosePositions.push(...data);

    if (data.length < QUERY_SIZE) break;
  }

  const volumes = spotSwaps
    .map((swap) => ({
      token: swap.tokenA.id,
      volume: BigNumber(swap.amountSold),
      volumeUsd: BigNumber(swap.amountSoldUSD),
    }))
    .concat(
      openPositions.map((o) => ({
        token: o.position_positionAsset.id,
        volume: BigNumber(o.position_positionAmount),
        volumeUsd: BigNumber(o.position_positionAmountUSD),
      })),
    )
    .concat(
      closePositions.map((o) => ({
        token: o.soldAsset.id,
        volume: BigNumber(o.amountOut),
        volumeUsd: BigNumber(o.amountOutUSD),
      })),
    )
    .concat(
      partialClosePositions.map((o) => ({
        token: o.soldAsset.id,
        volume: BigNumber(o.amountOut),
        volumeUsd: BigNumber(o.amountOutUSD),
      })),
    );

  volumes.forEach((v) => {
    if (!tokenVolumes[v.token]) {
      tokenVolumes[v.token] = {
        volume: v.volume,
        volumeUsd: v.volumeUsd,
      };
    } else {
      tokenVolumes[v.token] = {
        volume: tokenVolumes[v.token].volume.plus(v.volume),
        volumeUsd: tokenVolumes[v.token].volumeUsd.plus(v.volumeUsd),
      };
    }
  });

  return tokenVolumes;
}

async function getPoolVolumes() {
  return {};
}

export { tvl, getTokenVolumes, getPoolVolumes };
