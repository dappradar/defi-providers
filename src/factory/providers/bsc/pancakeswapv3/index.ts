import { ITvlParams, ITvlReturn, IBalances } from '../../../../interfaces/ITvl';
import { request, gql } from 'graphql-request';
import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';

const START_BLOCK = 26956207;
const THE_GRAPH_API_KEY = process.env?.THE_GRAPH_API_KEY;
const THEGRAPTH_ENDPOINT = `https://gateway-arbitrum.network.thegraph.com/api/${THE_GRAPH_API_KEY}/subgraphs/id/Hv1GncLY5docZoGtXjo4kwbTvxm3MAhVZqBZE4sUT9eZ`;

const QUERY_SIZE = 1000;
const TOKENS = gql`
  query getTokens($block: Int!, $skip: Int!) {
    tokens(block: { number: $block }, skip: $skip, first: ${QUERY_SIZE}, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      totalValueLocked
      decimals
    }
  }
`;
const MAX_SKIP = 2000;

async function getTvlFromSubgraph(
  endpoint: string,
  block: number,
): Promise<IBalances> {
  const balances = {};

  const promises = [];
  for (let i = 0; i <= MAX_SKIP; i += QUERY_SIZE) {
    promises.push(
      request(endpoint, TOKENS, {
        block,
        skip: i,
      }),
    );
  }

  const results = await Promise.all(promises);
  for (const result of results) {
    for (const token of result.tokens) {
      const decimalValue = BigNumber(token.totalValueLocked);
      const decimals = parseInt(token.decimals) || 18;
      const rawValue = decimalValue.multipliedBy(BigNumber(10).pow(decimals));
      balances[token.id.toLowerCase()] = rawValue;
    }
  }
  formatter.convertBalancesToFixed(balances);

  return balances;
}

function extractLatestBlockFromError(errorMessage: string): number | null {
  const match = errorMessage.match(/latest:\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

async function getTvlWithRetry(
  block: number,
  chain: string,
  provider: string,
  maxRetries = 3,
): Promise<any> {
  let currentBlock = block;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      return await getTvlFromSubgraph(THEGRAPTH_ENDPOINT, currentBlock);
    } catch (error) {
      const errorMessage = error?.message || '';

      if (
        errorMessage.includes('Unavailable(missing block:') &&
        errorMessage.includes('latest:')
      ) {
        const latestBlock = extractLatestBlockFromError(errorMessage);

        if (
          latestBlock &&
          latestBlock >= START_BLOCK &&
          latestBlock < currentBlock
        ) {
          log.info({
            message: `Retrying with latest available block: ${latestBlock} (attempted block: ${currentBlock}, retry: ${
              retryCount + 1
            })`,
            detail: `${chain}/${provider}`,
            endpoint: 'tvl',
          });

          currentBlock = latestBlock;
          retryCount++;
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error(
    `Max retries (${maxRetries}) exceeded for ${chain}/${provider}`,
  );
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { chain, provider } = params;
  const block = params.block - 1000;

  if (block < START_BLOCK) {
    return { balances: {} };
  }

  try {
    const balances = await getTvlWithRetry(block, chain, provider);
    return { balances };
  } catch (error) {
    const errorMessage = error?.message || '';

    log.info({
      message: `No data available for ${chain}/${provider} with block ${block}: ${errorMessage}`,
      detail: `${chain}/${provider}`,
      endpoint: 'tvl',
    });
    return { balances: {} };
  }
}

export { tvl };
