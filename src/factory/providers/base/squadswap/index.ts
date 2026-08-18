import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import squadswapVolumes from '../../../../util/calculators/squadswapVolumes';
import thanosVault, {
  CL_INITIALIZE_TOPIC,
  BIN_INITIALIZE_TOPIC,
} from '../../../../util/calculators/thanosVault';
import BigNumber from 'bignumber.js';
import CONSTANTS from '../../../../constants/contracts.json';

const THE_GRAPH_API_KEY = process.env?.THE_GRAPH_API_KEY;
const QUERY_SIZE = 1000;

const V2_START_BLOCK = 19727118;
const V2_FACTORY_ADDRESS = '0xba34aA640b8Be02A439221BCbea1f48c1035EEF9';

const V3_START_BLOCK = 19730499;
const V3_FACTORY_ADDRESS = '0xa1288b64F2378276d0Cc56F08397F70BecF7c0EA';

// Thanos (V4)
const THANOS_START_BLOCK = 40500004;
const THANOS_VAULT_ADDRESS = '0x126c5d558589788292c33667fba07e07b4b0990b';
const THANOS_CL_POOL_MANAGER_ADDRESS =
  '0xbb07a7bdfc50829ce932adccc0498f0e29f49f50';
const THANOS_BIN_POOL_MANAGER_ADDRESS =
  '0xd243e0c2fc2a91eace239e0c54023559a47c5f04';
const THANOS_SUBGRAPH_ENDPOINT =
  'https://api.subgraph.ormilabs.com/api/public/46e5cb0d-fad2-4ba7-8fa5-9bd207380e15/subgraphs/squadswap-thns-v2-base/thns-base/gn';

// Dynamo and WOW are only served by subgraphs, they are used for volumes
const DYNAMO_SUBGRAPH_ENDPOINT = `https://gateway.thegraph.com/api/${THE_GRAPH_API_KEY}/subgraphs/id/42unCN8Y1j3RnvqQ8ZNKr91g3V9Msju2sd7pVgWcH8F2`;
const WOW_SUBGRAPH_ENDPOINT = `https://gateway.thegraph.com/api/${THE_GRAPH_API_KEY}/subgraphs/id/29yKNuQstCzNDNcnPgFCw27xsThidsNW4kxxo93msXWi`;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < V2_START_BLOCK) {
    return {};
  }
  let balancesV3 = {};

  const { balances: balancesV2 } = await uniswapV2.getTvl(
    V2_FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  if (block >= V3_START_BLOCK) {
    balancesV3 = await uniswapV3.getTvl(
      V3_FACTORY_ADDRESS,
      V3_START_BLOCK,
      block,
      chain,
      provider,
      web3,
      'algebra',
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
    const ethBalance = await web3.eth.getBalance(THANOS_VAULT_ADDRESS, block);
    balancesThanos[CONSTANTS.WMAIN_ADDRESS.base] = BigNumber(
      balancesThanos[CONSTANTS.WMAIN_ADDRESS.base] || 0,
    )
      .plus(ethBalance)
      .toFixed();
  }

  const balances = formatter.sum([balancesV2, balancesV3, balancesThanos]);

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
    uniswapV2.getPoolVolumes(
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
    uniswapV2.getTokenVolumes(
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
