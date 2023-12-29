import { gql } from 'graphql-request';

export const START_BLOCK = 153209943;
export const BUCKETS_FACTORY_ADDRESS =
  '0x4e6f7372bCE4083c779c17B240A94dc2EA57AE67';
export const POSITION_MANAGER_ADDRESS =
  '0x86890E30cE9E1e13Db5560BbEb435c55567Af1cd';
export const TRADER_BALANCE_VAULT_ADDRESS =
  '0xc08FFBBA8c5f42beb7e6dd29142cC61855a3076B';
export const DEFAULT_TOKENS = {
  USDCe: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
  USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  USDT: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
  WETH: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  WBTC: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
  ARB: '0x912ce59144191c1204e64559fe8253a0e49e6548',
  DAI: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
  LINK: '0xf97f4df75117a78c1a5a0dbb814af92458539fb4',
  PENDLE: '0x0c880f6761F1af8d9Aa9C466984b80DAb9a8c9e8',
  GMX: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a',
  GNS: '0x18c11FD286C5EC11c3b683Caa813B77f5163A122',
  RDNT: '0x3082CC23568eA640225c2467653dB90e9250AaA0',
  MAGIC: '0x539bdE0d7Dbd336b79148AA742883198BBF60342',
  JOE: '0x371c7ec6D8039ff7933a2AA28EB827Ffe1F52f07',
  STG: '0x6694340fc020c5E6B96567843da2df01b2CE1eb6',
  EPMX: '0xA533f744B179F2431f5395978e391107DC76e103',
};
export const AAVE_TOKENS = {
  ['0xda10009cbd5d07dd0cecc66161fc93d7c9000da1']:
    '0x82E64f49Ed5EC1bC6e43DAD4FC8Af9bb3A2312EE',
  ['0xaf88d065e77c8cC2239327C5EDb3A432268e5831']:
    '0x625E7708f30cA75bfd92586e17077590C60eb4cD',
  ['0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9']:
    '0x6ab707Aca953eDAeFBc4fD23bA73294241490620',
  ['0xf97f4df75117a78c1a5a0dbb814af92458539fb4']:
    '0x191c10Aa4AF7C30e871E70C95dB0E4eb77237530',
  ['0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f']:
    '0x078f358208685046a11C85e8ad32895DED33A249',
  ['0x82af49447d8a07e3bd95bd0d56f35241523fbab1']:
    '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
};

export const GRAPHQL_API =
  'https://api.thegraph.com/subgraphs/name/primex-finance/primex-arbitrum-mainnet';
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
