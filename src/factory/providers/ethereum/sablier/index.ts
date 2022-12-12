import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import fetch from 'node-fetch';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';

const POOL_ADDRESS = '0xA4fc358455Febe425536fd1878bE67FfDBDEC59a';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 8921858) {
    return {};
  }

  const result = await fetch(
    `https://api.thegraph.com/subgraphs/name/sablierhq/sablier`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ tokens (first: 1000, block: {number: ${block - 5}}) { id } }`,
      }),
    },
  ).then((resp) => resp.json());

  const tokens = result.data.tokens.map((token) => token.id);

  const balanceResults = await util.getTokenBalances(
    POOL_ADDRESS,
    tokens,
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
