import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';

const ORDERBOOK_CONTRACT = 'v1.orderbook.near';
const PERPS_CONTRACT = 'v1.tonic-perps.near';
const RAINBOW_USDC =
  'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near';
const START_BLOCK = 64029975;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }
  const balances = {};

  const market = await web3.eth.callContractFunction(
    ORDERBOOK_CONTRACT,
    'list_markets',
    { from_index: 0, limit: 100 },
    block,
  );
  const tokens = market
    .filter((market) => market.state === 'Active')
    .map((market) => market['base_token']['token_type']['account_id'])
    .filter((token) => token && token.length > 0 && token !== 'near');
  const uniqTokenList = [...new Set(tokens), RAINBOW_USDC];

  for (const token of uniqTokenList) {
    balances[token.toString()] = await web3.eth.callContractFunction(
      token,
      'ft_balance_of',
      { account_id: ORDERBOOK_CONTRACT },
      block,
    );
  }
  balances['wrap.near'] = await web3.eth.getBalance(ORDERBOOK_CONTRACT, block);
  const tokenPerps = (
    await web3.eth.callContractFunction(PERPS_CONTRACT, 'get_assets', {}, block)
  )
    .filter((asset) => asset.id !== 'near')
    .map((asset) => asset.id);

  for (const token of tokenPerps) {
    balances[token.toString()] = await web3.eth.callContractFunction(
      token,
      'ft_balance_of',
      { account_id: PERPS_CONTRACT },
      block,
    );
  }
  const perpsAccountBalance = await web3.eth.getBalance(PERPS_CONTRACT, block);
  balances['wrap.near'] = BigNumber(balances['wrap.near']).plus(
    perpsAccountBalance,
  );

  return { balances };
}

export { tvl };
