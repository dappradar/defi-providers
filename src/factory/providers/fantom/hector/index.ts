import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';

const DAO_GRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/hectordao-hec/hector-dao';

const USDC = '0x04068da6c83afcfa0e13ba15a6696662335d5b75';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, date } = params;
  if (block < 20816532) {
    return {};
  }

  const PROTOCOL_METRIC_QUERY = gql`
    query {
      protocolMetrics(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        ${
          date == new Date(Date.now()).toISOString().slice(0, 10)
            ? ''
            : `block: { number: ${block} }`
        }
      ) {
        bankSupplied
        treasuryMarketValue
      }
    }
  `;

  const { protocolMetrics } = await request(
    DAO_GRAPH_URL,
    PROTOCOL_METRIC_QUERY,
  );

  const balances = {
    [USDC]: BigNumber(protocolMetrics[0].bankSupplied)
      .plus(BigNumber(protocolMetrics[0].treasuryMarketValue))
      .times(1e6)
      .toFixed(),
  };

  return { balances };
}

export { tvl };
