import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';
import uniswapV2Subgraph from '../../../../util/calculators/uniswapV2';
import squadswapVolumes from '../../../../util/calculators/squadswapVolumes';
import thanosVault, {
  CL_INITIALIZE_TOPIC,
  BIN_INITIALIZE_TOPIC,
} from '../../../../util/calculators/thanosVault';
import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';
import CONSTANTS from '../../../../constants/contracts.json';

const THE_GRAPH_API_KEY = process.env?.THE_GRAPH_API_KEY;

// Constants for original versions
const V2_START_BLOCK = 34130751;
const V3_START_BLOCK = 34184408;
const V3_FACTORY_ADDRESS = '0x009c4ef7C0e0Dd6bd1ea28417c01Ea16341367c3';
const V2_SUBGRAPH_ENDPOINT = `https://api.studio.thegraph.com/query/76181/exchangev2/version/latest`;

// Constants for new versions
const DYNAMO_START_BLOCK = 46188894;
const WOW_START_BLOCK = 46190543;
const WOW_FACTORY_ADDRESS = '0x10d8612D9D8269e322AB551C18a307cB4D6BC07B';
const DYNAMO_SUBGRAPH_ENDPOINT = `https://gateway.thegraph.com/api/${THE_GRAPH_API_KEY}/subgraphs/id/C9FE68cq1GXDiR1qghTQRaH5wVs5S5y4qwqd7cSEZ3Ur`;
const WOW_SUBGRAPH_ENDPOINT = `https://gateway.thegraph.com/api/${THE_GRAPH_API_KEY}/subgraphs/id/BgxeY5c3MiwAt4ahqiSq13eKWMGz9ax7dCgwxE7T7Nyn`;

// Constants for Thanos (V4)
const THANOS_START_BLOCK = 74380131;
const THANOS_VAULT_ADDRESS = '0x3754bd79d88e89f397ed1bffad8cdf3e0fdcc37e';
const THANOS_CL_POOL_MANAGER_ADDRESS =
  '0x9d3b119eff69cd81d324f654062b6ffa3dd7f405';
const THANOS_BIN_POOL_MANAGER_ADDRESS =
  '0xd7a5a9df1719ee83a4d10749019caabf137debac';
const THANOS_SUBGRAPH_ENDPOINT =
  'https://api.subgraph.ormilabs.com/api/public/46e5cb0d-fad2-4ba7-8fa5-9bd207380e15/subgraphs/squadswap-thns-v2-bsc/thns-bsc/gn';

const QUERY_SIZE = 1000;
const TOKENS = gql`
  query getTokens($id: String!, $block: Int!) {
    tokens(
      block: { number: $block }
      first: ${QUERY_SIZE}
      orderBy: id
      where: { id_gt: $id tradeVolumeUSD_gt: 100 }
    ) {
      id
      decimals
      totalLiquidity
    }
  }
`;

async function fetchTokenBalances(endpoint: string, block: number) {
  const balances = {};
  let lastId = '';

  while (true) {
    const requestResult = await request(endpoint, TOKENS, {
      block: block - 100,
      id: lastId,
    });

    for (const token of requestResult.tokens) {
      balances[token.id.toLowerCase()] = BigNumber(
        token.totalLiquidity,
      ).shiftedBy(Number(token.decimals));
    }

    if (requestResult.tokens.length < QUERY_SIZE) {
      break;
    }

    lastId = requestResult.tokens[requestResult.tokens.length - 1].id;
  }

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { chain, provider, web3 } = params;
  const block = params.block - 1000;
  if (block < V2_START_BLOCK) {
    return {};
  }

  // Original V2 (SquadSwap) balances
  // Subgraph stopped indexing after 46928463
  const balancesV2 = /*block >= V2_START_BLOCK
      ? await fetchTokenBalances(V2_SUBGRAPH_ENDPOINT, block)
      :*/ {};

  // Original V3 (SquadSwap) balances
  let balancesV3 = {};
  if (block >= V3_START_BLOCK) {
    balancesV3 = await uniswapV3.getTvl(
      V3_FACTORY_ADDRESS,
      V3_START_BLOCK,
      block,
      chain,
      provider,
      web3,
    );
  }

  // New V2 (Dynamo) balances
  const balancesDynamo =
    block >= DYNAMO_START_BLOCK
      ? await fetchTokenBalances(DYNAMO_SUBGRAPH_ENDPOINT, block)
      : {};

  // New V3 (WOW) balances
  let balancesWow = {};
  if (block >= WOW_START_BLOCK) {
    balancesWow = await uniswapV3.getTvl(
      WOW_FACTORY_ADDRESS,
      WOW_START_BLOCK,
      block,
      chain,
      provider,
      web3,
    );
  }

  // Thanos (V4) balances, all pool funds are held by a single Vault
  let balancesThanos = {};
  if (block >= THANOS_START_BLOCK) {
    balancesThanos = await thanosVault.getTvl(
      THANOS_VAULT_ADDRESS,
      [
        { address: THANOS_CL_POOL_MANAGER_ADDRESS, topic: CL_INITIALIZE_TOPIC },
        {
          address: THANOS_BIN_POOL_MANAGER_ADDRESS,
          topic: BIN_INITIALIZE_TOPIC,
        },
      ],
      THANOS_START_BLOCK,
      block,
      chain,
      provider,
      web3,
    );

    // Thanos pools use the zero address for the native token
    const bnbBalance = await web3.eth.getBalance(THANOS_VAULT_ADDRESS, block);
    balancesThanos[CONSTANTS.WMAIN_ADDRESS.bsc] = BigNumber(
      balancesThanos[CONSTANTS.WMAIN_ADDRESS.bsc] || 0,
    )
      .plus(bnbBalance)
      .toFixed();
  }

  // Combine all balances
  const balances = formatter.sum([
    balancesV2,
    balancesV3,
    balancesDynamo,
    balancesWow,
    balancesThanos,
  ]);

  return { balances };
}

/**
 * Volumes are served by a separate subgraph per version, so each of them is
 * queried and the results are merged. Pool ids never overlap between versions,
 * while token volumes of the same token are summed up.
 */
async function getPoolVolumes(params) {
  const { pools, block } = params;

  const [dynamoVolumes, wowVolumes, thanosVolumes] = await Promise.all([
    uniswapV2Subgraph.getPoolVolumes(
      DYNAMO_SUBGRAPH_ENDPOINT,
      QUERY_SIZE,
      pools,
      block,
      null,
    ),
    squadswapVolumes.getV3PoolVolumes(
      WOW_SUBGRAPH_ENDPOINT,
      QUERY_SIZE,
      pools,
      block,
    ),
    squadswapVolumes.getThanosPoolVolumes(
      THANOS_SUBGRAPH_ENDPOINT,
      QUERY_SIZE,
      pools,
      block,
    ),
  ]);

  return { ...dynamoVolumes, ...wowVolumes, ...thanosVolumes };
}

async function getTokenVolumes(params) {
  const { tokens, block } = params;

  const [dynamoVolumes, wowVolumes, thanosVolumes] = await Promise.all([
    uniswapV2Subgraph.getTokenVolumes(
      DYNAMO_SUBGRAPH_ENDPOINT,
      QUERY_SIZE,
      tokens,
      block,
      {
        volume: 'tradeVolume',
        volumeUsd: 'tradeVolumeUSD',
      },
    ),
    squadswapVolumes.getTokenVolumes(
      WOW_SUBGRAPH_ENDPOINT,
      QUERY_SIZE,
      tokens,
      block,
    ),
    squadswapVolumes.getTokenVolumes(
      THANOS_SUBGRAPH_ENDPOINT,
      QUERY_SIZE,
      tokens,
      block,
    ),
  ]);

  const tokenVolumes = {};
  for (const versionVolumes of [dynamoVolumes, wowVolumes, thanosVolumes]) {
    for (const [token, tokenVolume] of Object.entries(versionVolumes)) {
      if (!tokenVolumes[token]) {
        tokenVolumes[token] = { volume: BigNumber(0), volumeUsd: BigNumber(0) };
      }
      tokenVolumes[token] = {
        volume: tokenVolumes[token].volume.plus(tokenVolume.volume),
        volumeUsd: tokenVolumes[token].volumeUsd.plus(tokenVolume.volumeUsd),
      };
    }
  }

  return tokenVolumes;
}

export { tvl, getPoolVolumes, getTokenVolumes };
