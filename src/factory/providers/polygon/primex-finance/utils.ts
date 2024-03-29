import { gql } from 'graphql-request';

export const START_BLOCK = 48893377;
export const BUCKETS_FACTORY_ADDRESS =
  '0x7E6915D307F434E4171cCee90e180f5021c60089';
export const POSITION_MANAGER_ADDRESS =
  '0x02bcaA4633E466d151b34112608f60A82a4F6035';
export const TRADER_BALANCE_VAULT_ADDRESS =
  '0x0801896C67CF024606BcC92bd788d6Eb077CC74F';
export const DEFAULT_TOKENS = {
  WETH: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
  WBTC: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
  WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  USDC: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  USDT: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
  EPMX: '0xDc6D1bd104E1efa4A1bf0BBCf6E0BD093614E31A',
};
export const AAVE_TOKENS = {
  ['0x7ceb23fd6bc0add59e62ac25578270cff1b9f619']:
    '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
  ['0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6']:
    '0x078f358208685046a11C85e8ad32895DED33A249',
  ['0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270']:
    '0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97',
  ['0x2791bca1f2de4661ed88a30c99a7a9449aa84174']:
    '0x625E7708f30cA75bfd92586e17077590C60eb4cD',
  ['0xc2132d05d31c914a87c6611c10748aeb04b58e8f']:
    '0x6ab707Aca953eDAeFBc4fD23bA73294241490620',
};

export const GRAPHQL_API =
  'https://api.thegraph.com/subgraphs/name/primex-finance/primex';
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
