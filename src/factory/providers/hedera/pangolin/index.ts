import { request, gql } from 'graphql-request';
import { hethers } from '@hashgraph/hethers';
import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { log } from '../../../../util/logger/logger';

const START_BLOCK = 1675123200;

const BLOCKS_ENDPOINT =
  'https://hedera-graph.pangolin.network/subgraphs/name/blocks';
const PANGOLIN_ENDPOINT =
  'https://hedera-graph.pangolin.network/subgraphs/name/pangolin';

const BLOCKS = gql`
  query getBlock($timestamp: BigInt!) {
    blocks(
      where: { timestamp_gt: $timestamp }
      orderBy: timestamp
      orderDirection: asc
      first: 1
    ) {
      number
    }
  }
`;
const TOKENS = gql`
  query getTokens($blockNumber: Int!) {
    tokens(block: { number: $blockNumber }) {
      id
      decimals
      totalLiquidity
    }
  }
`;
const LATEST_TOKENS = gql`
  query getTokens {
    tokens {
      id
      decimals
      totalLiquidity
    }
  }
`;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }
  const balances = {};

  const blocksResult = await request(BLOCKS_ENDPOINT, BLOCKS, {
    timestamp: block,
  });

  let tokensResult;
  try {
    tokensResult = await request(PANGOLIN_ENDPOINT, TOKENS, {
      blockNumber: Number(blocksResult.blocks[0].number),
    });
  } catch (e) {
    log.warning({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tvl of hedera/pangolin`,
      endpoint: 'tvl',
    });
    tokensResult = await request(PANGOLIN_ENDPOINT, LATEST_TOKENS);
  }

  for (const token of tokensResult.tokens) {
    if (BigNumber(token.totalLiquidity).gt(0)) {
      balances[hethers.utils.asAccountString(token.id)] = BigNumber(
        token.totalLiquidity,
      ).shiftedBy(Number(token.decimals));
    }
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
