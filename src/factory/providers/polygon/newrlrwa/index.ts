import util from '../../../../util/blockchainUtil';
import { request, gql } from 'graphql-request';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const START_BLOCK = 55129443;
const PROTOCOL_ADDRESSES = ['0xbFeb0b78f9AB8223657B65c5aCAD846c12F8AA89'];
const USDC_TOKEN_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
const TRACKED_TOKENS = [
  '0x01D6D93feAA0a7157B22cF034d09807e63D1E3d8', // SUGR
  '0x86a9B606295C8b76A0C921463Cd6312fc58483e1', // INRC
];
const THEGRAPTH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-polygon';
const LAST_SWAP_QUERY = gql`
  query trades($block: Int!, $tokenIn: String!, $tokenOut: String!) {
    swaps(
      where: { tokenIn: $tokenIn, tokenOut: $tokenOut }
      orderBy: timestamp
      orderDirection: desc
      first: 1 # block: {number: $block}
    ) {
      amountIn
      amountOut
    }
  }
`;

async function getConversion(
  block: number,
  fromToken: string,
  toToken: string,
) {
  const data = await request(THEGRAPTH_ENDPOINT, LAST_SWAP_QUERY, {
    block: block,
    tokenIn: fromToken,
    tokenOut: toToken,
  });
  // Get the Last Traded Price of the Token against USDC for conversion
  const swap = data['swaps'][0];
  return swap['amountOut'] / swap['amountIn'];
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  let usdcValue = 0;

  const tokenBalances = await util.getTokenBalancesOfHolders(
    PROTOCOL_ADDRESSES,
    TRACKED_TOKENS,
    block,
    chain,
    web3,
  );
  const rawBalances = {};
  formatter.sumMultiBalanceOf(rawBalances, tokenBalances);
  // rawBalances now contains the commodity tokens held in the protocol addresses

  for (const token of TRACKED_TOKENS) {
    if (!rawBalances[token]) {
      continue;
    }
    // UniswapV3 is used to get the conversion rate of the commodity tokens to USDC
    const conversionRate = await getConversion(block, token, USDC_TOKEN_ADDRESS);
    const tokenBalance = rawBalances[token];
    usdcValue += tokenBalance * conversionRate;
  }

  const balances = { [USDC_TOKEN_ADDRESS]: usdcValue.toString() };

  return { balances };
}

export { tvl };
