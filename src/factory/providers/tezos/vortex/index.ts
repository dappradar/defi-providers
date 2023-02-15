import { request, gql } from 'graphql-request';
import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const START_BLOCK = 1730490;
const STAKING_CONTRACT = 'KT1Cp18EbxDk2WcbC1YVUyGuwuvtzyujwu4U';
const THEGRAPTH_ENDPOINT = 'https://api.vortex.network/v1/graphql';
const PAIRS = gql`
  query pairs {
    data: pair {
      id
    }
  }
`;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }
  const balances = {};

  const stakingBalance = await web3.eth.getAllTokensBalances(
    STAKING_CONTRACT,
    block,
  );
  formatter.sumMultiBalanceOf(balances, stakingBalance, chain, provider);

  const pairs = await request(THEGRAPTH_ENDPOINT, PAIRS);

  for (const pair of pairs.data) {
    const [tokenBalances, xtzBalance] = await Promise.all([
      web3.eth.getAllTokensBalances(pair.id, block),
      web3.eth.getBalance(pair.id, block),
    ]);
    if (xtzBalance.isGreaterThan(0)) {
      balances['xtz'] = BigNumber(balances['xtz'] || 0).plus(xtzBalance);
    }

    formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  }

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
