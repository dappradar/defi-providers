import { request, gql } from 'graphql-request';
import util from '../../../../util/blockchainUtil';
import BigNumber from 'bignumber.js';

const graphUrl =
  'https://api.thegraph.com/subgraphs/name/sushiswap/bentobox-arbitrum';
const bentoboxQuery = gql`
  query get_bentoboxes($block: Int) {
    bentoBoxes(first: 100, block: { number: $block }) {
      id
      totals(first: 1000, orderDirection: desc) {
        token {
          id
        }
      }
    }
  }
`;

async function kashiLending(block, chain, web3) {
  console.time('Getting KashiBalance');

  const boxTokens = [];
  const kashiBalances = {};

  const { bentoBoxes } = await request(graphUrl, bentoboxQuery, { block });

  for (const bentoBox of bentoBoxes) {
    boxTokens.push(...bentoBox.totals.map((token) => token.token.id));

    const boxesBalances = await util.getTokenBalances(
      bentoBox.id,
      boxTokens,
      block,
      chain,
      web3,
    );
    for (const boxBalance of boxesBalances) {
      kashiBalances[boxBalance.token] = BigNumber(
        kashiBalances[boxBalance.token] || 0,
      ).plus(boxBalance.balance);
    }
  }

  console.timeEnd('Getting KashiBalance');

  return kashiBalances;
}

export { kashiLending };
