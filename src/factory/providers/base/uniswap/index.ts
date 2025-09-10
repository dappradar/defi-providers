import { request, gql } from 'graphql-request';
import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { log } from '../../../../util/logger/logger';

const START_BLOCK = 6601915;
const QUERY_SIZE = 1000;
const THE_GRAPH_API_KEY = process.env?.THE_GRAPH_API_KEY;
const SUBGRAPH_ENDPOINT = `https://gateway-arbitrum.network.thegraph.com/api/${THE_GRAPH_API_KEY}/subgraphs/id/4jGhpKjW4prWoyt5Bwk1ZHUwdEmNWveJcjEyjoTZWCY9`;
const TOKENS = gql`
  query getTokens($id: String!, $block: Int!) {
    tokens(
      block: { number: $block }
      first: ${QUERY_SIZE}
      orderBy: id
      where: { id_gt: $id tradeVolumeUSD_gt: 100000 }
    ) {
      id
      decimals
      totalLiquidity
    }
  }
`;

function extractLatestBlockFromError(errorMessage: string): number | null {
  const match = errorMessage.match(/latest:\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

async function fetchTokens(block: number): Promise<any> {
  const balances = {};
  let lastId = '';

  while (true) {
    const requestResult = await request(SUBGRAPH_ENDPOINT, TOKENS, {
      block,
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

async function fetchTokensWithRetry(
  block: number,
  chain: string,
  provider: string,
  maxRetries = 3,
): Promise<any> {
  let currentBlock = block;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      return await fetchTokens(currentBlock);
    } catch (error) {
      const errorMessage = error?.message || '';

      // Check if it's a "missing block" error with latest block info
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

      // If it's not a missing block error or we can't extract a valid latest block, throw the error
      throw error;
    }
  }

  throw new Error(
    `Max retries (${maxRetries}) exceeded for ${chain}/${provider}`,
  );
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider } = params;
  const targetBlock = block - 100;

  if (targetBlock < START_BLOCK) {
    return {};
  }

  try {
    const balances = await fetchTokensWithRetry(targetBlock, chain, provider);
    formatter.convertBalancesToFixed(balances);
    return { balances };
  } catch (error) {
    const errorMessage = error?.message || '';

    log.info({
      message: `No data available for ${chain}/${provider} with block ${targetBlock}: ${errorMessage}`,
      detail: `${chain}/${provider}`,
      endpoint: 'tvl',
    });
    return { balances: {} };
  }
}

export { tvl };
