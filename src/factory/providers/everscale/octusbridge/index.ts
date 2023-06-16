import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const BRIDGE_ADDRESS =
  '0:36122a25a11e8772dc5d94f5f6a653d4661f6e474bc85cb275aece185acd62a4';
const STAKING_ADDRESS =
  '0:ec6a2fd6c3732e494684d016f1addec1a1828b6b7ecfcd30b34e8e5ad2d421d0';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  let tokens = {};
  try {
    tokens = await basicUtil.readFromCache('store.json', chain, provider);
  } catch {}

  const [tokenBalances, stakeBalances] = await Promise.all([
    web3.eth.getBalances(BRIDGE_ADDRESS, block),
    web3.eth.getBalances(STAKING_ADDRESS, block),
  ]);

  tokenBalances.push(...stakeBalances);

  const newTokens = tokenBalances
    .map((data) => data.token)
    .filter((token) => !tokens[token]);

  if (newTokens.length > 0) {
    const tokensData = await Promise.all(
      newTokens.map((token) => web3.eth.getTokenData(token, block)),
    );
    tokensData.forEach((data, index) => {
      if (data) {
        tokens[newTokens[index]] = {
          name: data.name,
          symbol: data.symbol,
          decimals: data.decimals,
        };
      }
    });

    basicUtil.savedIntoCache(tokens, 'store.json', chain, provider);
  }

  tokenBalances.forEach((data) => {
    data.balance = data.balance.times(10 ** tokens[data.token].decimals);
  });

  const balances = {};

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
