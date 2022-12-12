import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import { request, gql } from 'graphql-request';

const START_BLOCK = 17286147;
const V2_ADDRESS = '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce';
const TOKEN_API =
  'https://api.thegraph.com/subgraphs/name/beethovenxfi/beethovenx';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, date, chain, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }

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

  const v2Tokens = await request(TOKEN_API, POOL_TOKENS, {
    block,
  });

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
  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
