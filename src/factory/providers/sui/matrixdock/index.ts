import { ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';
import { request, gql } from 'graphql-request';

const TOKEN =
  '0x9d297676e7a4b771ab023291377b2adfaa4938fb9080b8d12430e4b108b836a9::xaum::XAUM';

const GRAPHQL_ENDPOINT = 'https://graphql.mainnet.sui.io/graphql';

const TOKEN_SUPPLY_QUERY = gql`
  query getTokenSupply($coinType: String!) {
    coinMetadata(coinType: $coinType) {
      decimals
      symbol
      supply
    }
  }
`;

async function tvl(): Promise<Partial<ITvlReturn>> {
  const balances = {};

  try {
    const graphqlResult = await request(GRAPHQL_ENDPOINT, TOKEN_SUPPLY_QUERY, {
      coinType: TOKEN,
    });

    if (
      graphqlResult &&
      graphqlResult.coinMetadata &&
      graphqlResult.coinMetadata.supply
    ) {
      formatter.merge(balances, TOKEN, graphqlResult.coinMetadata.supply);
    }
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching MatrixDock token supply',
      endpoint: 'tvl',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
