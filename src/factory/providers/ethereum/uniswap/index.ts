import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { request } from 'graphql-request';
import formatter from '../../../../util/formatter';

const START_BLOCK = 10000835;
const QUERY_SIZE = 1000;
const MAX_LIMIT = 5000;
const SUBGRAPH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v2-dev';
const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const GET_PAIRS = `
    query getPairs($block: Int!, $skip: Int!) {
    pairs(
      block: { number: $block }
      orderBy: txCount
      orderDirection: desc
      first: ${QUERY_SIZE}
      skip: $skip
      where: {
        reserveUSD_not: "0"
      }
    ) {
      token0 {
        id
        name
        decimals
      }
      token1 {
        id
        name
        decimals
      }
      reserve0
      reserve1
      reserveUSD
      reserveETH
      txCount
      volumeUSD
    }
  }
`;
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }
  const promises = [];
  let skip = 0;
  while (MAX_LIMIT >= skip) {
    promises.push(
      request(SUBGRAPH_ENDPOINT, GET_PAIRS, {
        block: block,
        skip: skip,
      }),
    );
    skip += QUERY_SIZE;
  }

  const requestResult = await Promise.all(promises);
  const balances = {};
  requestResult.forEach((result, index) => {
    result.pairs.forEach((pair) => {
      if (Number(pair.txCount) < 100000 || Number(pair.volumeUSD) < 100000) {
        balances[WETH] = BigNumber(pair.reserveETH)
          .shiftedBy(18)
          .plus(balances[WETH] || '0')
          .toFixed();
      } else {
        if (balances[pair.token0.id]) {
          balances[pair.token0.id] = BigNumber(pair.reserve0)
            .shiftedBy(Number(pair.token0.decimals))
            .plus(balances[pair.token0.id])
            .toFixed();
        } else {
          balances[pair.token0.id] = BigNumber(pair.reserve0)
            .shiftedBy(Number(pair.token0.decimals))
            .toFixed();
        }
        if (balances[pair.token1.id]) {
          balances[pair.token1.id] = BigNumber(pair.reserve1)
            .shiftedBy(Number(pair.token1.decimals))
            .plus(balances[pair.token1.id])
            .toFixed();
        } else {
          balances[pair.token1.id] = BigNumber(pair.reserve1)
            .shiftedBy(Number(pair.token1.decimals))
            .toFixed();
        }
      }
    });
  });
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
