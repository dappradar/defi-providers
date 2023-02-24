import { request, gql } from 'graphql-request';
import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 600615;
const THEGRAPTH_ENDPOINT = process.env.PANCAKESWAP_GRAPH;
const QUERY_SIZE = 1000;
const TOKENS = gql`
  query getTokens($skip: Int!) {
    tokens(skip: $skip, first: ${QUERY_SIZE} orderBy: tradeVolumeUSD, orderDirection: desc) {
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

  let skip = 0;

  // 2000 is max skip
  while (skip <= 2000) {
    const requestResult = await request(THEGRAPTH_ENDPOINT, TOKENS, {
      block: block,
      skip: skip,
    });

    for (const token of requestResult.tokens) {
      if (
        token.id.toLowerCase() !== '0xc61713cd43ccb88ef0aae42281cc51f9ed974b78' //scam token
      ) {
        balances[token.id.toLowerCase()] = BigNumber(
          token.totalLiquidity,
        ).shiftedBy(Number(token.decimals));
      }
    }

    if (requestResult.tokens.length < QUERY_SIZE) {
      break;
    }
    skip += QUERY_SIZE;
  }

  const stableSwapBalances = await util.getTokenBalancesOfEachHolder(
    [
      '0x169f653a54acd441ab34b73da9946e2c451787ef',
      '0xc2f5b9a3d9138ab2b74d581fc11346219ebf43fe',
      '0x3efebc418efb585248a0d2140cfb87afcc2c63dd',
      '0x6d8fba276ec6f1eda2344da48565adbca7e4ffa5',
      '0x49079d07ef47449af808a4f36c2a8dec975594ec',
    ],
    [
      '0x55d398326f99059ff775485246999027b3197955', //USDT
      '0xe9e7cea3dedca5984780bafc599bd69add087d56', //BUSD
      '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', //USDC
      '0x4268b8f0b87b6eae5d897996e6b845ddbd99adf3', //AXLUSDC
      '0x0782b6d8c4551b9760e74c0545a9bcd90bdc41e5', //HAY
    ],
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, stableSwapBalances);

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
