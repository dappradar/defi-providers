import { gql } from 'graphql-request';

export const START_BLOCK = 153209943;
export const BUCKETS_FACTORY_ADDRESS =
  '0x7dE8607157124c894Ba9F18dd6138B5E8AAd5890';
export const POSITION_MANAGER_ADDRESS =
  '0x99d63fEA4b3Ef6ca77941df3C5740dAd1586f0B8';
export const TRADER_BALANCE_VAULT_ADDRESS =
  '0x156e2fC8e1906507412BEeEB6640Bf999a1Ea76b';
export const DEFAULT_TOKENS = {
  WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
  MATIC: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
  LINK: '0x514910771af9ca656af840dff83e8264ecf986ca',
  UNI: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
  SOL: '0xD31a59c85aE9D8edEFeC411D448f90841571b89c',
  MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
  SNX: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
  AAVE: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
  COMP: '0xc00e94cb662c3520282e6f5717214004a7f26888',
  CRV: '0xd533a949740bb3306d119cc777fa900ba034cd52',
  ['1INCH']: '0x111111111117dC0aa78b770fA6A738034120C302',
  EPMX: '0xA533f744B179F2431f5395978e391107DC76e103',
};
export const AAVE_TOKENS = {
  ['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2']:
    '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',
  ['0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0']:
    '0x0B925eD163218f6662a35e0f0371Ac234f9E9371',
  ['0x2260fac5e5542a773aa44fbcfedf7c193bc2c599']:
    '0x5Ee5bf7ae06D1Be5997A1A72006FE6C607eC6DE8',
  ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48']:
    '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
  ['0x6b175474e89094c44da98b954eedeac495271d0f']:
    '0x018008bfb33d285247A21d44E50697654f754e63',
  ['0x514910771af9ca656af840dff83e8264ecf986ca']:
    '0x5E8C8A7243651DB1384C0dDfDbE39761E8e7E51a',
  ['0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9']:
    '0xA700b4eB416Be35b2911fd5Dee80678ff64fF6C9',
};

export const GRAPHQL_API =
  'https://api.thegraph.com/subgraphs/name/primex-finance/primex-ethereum-mainnet';
export const QUERY_SIZE = 100;
export const SWAP_VOLUMES_QUERY = (skip: number) => gql`
  query volumes($fromTimestamp: String!, $toTimestamp: String!) {
    spotSwaps(
      where: {
        blockTimestamp_gte: $fromTimestamp
        blockTimestamp_lte: $toTimestamp
      }
      skip: ${skip}
    ) {
      tokenA {
        id
      }
      amountSold
      amountSoldUSD
    }
  }
`;
export const OPEN_POSITIONS_VOLUMES_QUERY = (skip: number) => gql`
  query volumes($fromTimestamp: String!, $toTimestamp: String!) {
    openPositions(
      where: {
        blockTimestamp_gte: $fromTimestamp
        blockTimestamp_lte: $toTimestamp
      }
      skip: ${skip}
    ) {
      position_positionAsset {
        id
      }
      position_positionAmount
      position_positionAmountUSD
    }
  }
`;
export const CLOSE_POSITIONS_VOLUMES_QUERY = (skip: number) => gql`
  query volumes($fromTimestamp: String!, $toTimestamp: String!) {
    closePositions(
      where: {
        blockTimestamp_gte: $fromTimestamp
        blockTimestamp_lte: $toTimestamp
      }
      skip: ${skip}
    ) {
      soldAsset {
        id
      }
      amountOut
      amountOutUSD
    }
  }
`;
export const PARTIALLY_CLOSE_POSITIONS_VOLUMES_QUERY = (skip: number) => gql`
  query volumes($fromTimestamp: String!, $toTimestamp: String!) {
    partialClosePositions(
      where: {
        blockTimestamp_gte: $fromTimestamp
        blockTimestamp_lte: $toTimestamp
      }
      skip: ${skip}
    ) {
      soldAsset {
        id
      }
      amountOut
      amountOutUSD
    }
  }
`;
