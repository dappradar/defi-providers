import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import { request, gql } from 'graphql-request';
import { log } from '../../../../util/logger/logger';

const START_BLOCK = 7003431;
const V2_ADDRESS = '0xBA12222222228d8Ba445958a75a0704d566BF2C8';
const THE_GRAPH_API_KEY = process.env?.THE_GRAPH_API_KEY;
const TOKEN_API = `https://gateway.thegraph.com/api/${THE_GRAPH_API_KEY}/subgraphs/id/F5jeL2nMXZt5LU6kSway7Vi2PTUcqDbw1gMQEbrmiVdJ`;

function extractLatestBlockFromError(errorMessage: string): number | null {
  const match = errorMessage.match(/latest:\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

async function fetchTokens(
  block: number,
  date: string,
  chain: string,
  provider: string,
  web3: any,
): Promise<any> {
  const POOL_TOKENS = gql`
    {
      balancers (
        first: 1000
        ${
          date == new Date(Date.now()).toISOString().slice(0, 10)
            ? ''
            : `block: { number: ${block} }`
        }
      ) {
        pools {
          tokens {
            address
          }
        }
      }
    }`;

  const v2Tokens = await request(TOKEN_API, POOL_TOKENS);

  let tokenAddresses = [];
  v2Tokens.balancers[0].pools.forEach((pool) => {
    tokenAddresses.push(...pool.tokens.map((token) => token.address));
  });
  tokenAddresses = [...new Set(tokenAddresses)];

  const tokenBalances = await util.getTokenBalances(
    V2_ADDRESS,
    tokenAddresses,
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

async function fetchTokensWithRetry(
  block: number,
  date: string,
  chain: string,
  provider: string,
  web3: any,
  maxRetries = 3,
): Promise<any> {
  let currentBlock = block;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      return await fetchTokens(currentBlock, date, chain, provider, web3);
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
  const { block, date, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }

  try {
    return await fetchTokensWithRetry(block, date, chain, provider, web3);
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
