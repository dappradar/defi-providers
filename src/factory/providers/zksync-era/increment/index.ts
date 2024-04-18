import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 28541484;
const VAULT_ADDRESS = '0x703500cAF3c79aF68BB3dc85A6846d1C7999C672';
const SUBGRAPH_ENDPOINT =
  'https://subgraph.increment.finance/subgraphs/name/Increment-Finance/subgraph';
const TVL_QUERY = gql`
  query Tvl($timestamp: Int!) {
    tvlHourlyAggregates(
      where: { openTimestamp_lte: $timestamp, closeTimestamp_gt: $timestamp }
    ) {
      openTimestamp
      closeTimestamp
      amount
    }
  }
`;

async function getTVL(block, chain, web3) {
  let amount;
  const { timestamp } = await web3.eth.getBlock(block);
  try {
    amount = await request(SUBGRAPH_ENDPOINT, TVL_QUERY, {
      timestamp,
    }).then((data) => data.tvlHourlyAggregates[0].amount);
  } catch {
    amount = await getTVL(block - basicUtil.getDelay(chain), chain, web3);
  }
  return amount;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};
  const amount = await getTVL(block, chain, web3);
  balances[VAULT_ADDRESS] = BigNumber(amount);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
