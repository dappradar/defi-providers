import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import pancakeswapV3subgraph from '../../../../util/calculators/pancakeswapV3subgraph';
import { log } from '../../../../util/logger/logger';

const START_BLOCK = 26956207;
const THE_GRAPH_API_KEY = process.env?.THE_GRAPH_API_KEY;
const THEGRAPTH_ENDPOINT = `https://gateway-arbitrum.network.thegraph.com/api/${THE_GRAPH_API_KEY}/subgraphs/id/A1BC1hzDsK4NTeXBpKQnDBphngpYZAwDUF7dEBfa3jHK`;

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
      return await pancakeswapV3subgraph.getTvlFromSubgraph(
        THEGRAPTH_ENDPOINT,
        currentBlock,
      );
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
