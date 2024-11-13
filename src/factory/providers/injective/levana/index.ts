import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const LEVANA_FACTORY_ADDRESS = 'inj1vdu3s39dl8t5l88tyqwuhzklsx9587adv8cnn9';
const MARKETS = 'markets';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  let balances = {};

  const limit = 30;
  let markets = [];
  const marketAddresses = [];
  let iterationMarkets = [];
  do {
    const start_after = markets.length
      ? markets[markets.length - 1]
      : undefined;

    const query = {
      limit,
      ...(start_after && { start_after }),
    };

    iterationMarkets = await web3.eth
      .call(LEVANA_FACTORY_ADDRESS, MARKETS, query)
      .then((response) => response[MARKETS]);
    markets = markets.concat(iterationMarkets);

    for (const iterationMarket of iterationMarkets) {
      const marketAddress = await web3.eth
        .call(LEVANA_FACTORY_ADDRESS, 'market_info', {
          market_id: iterationMarket,
        })
        .then((response) => response.market_addr);

      marketAddresses.push(marketAddress);
    }
  } while (iterationMarkets.length > 0);

  for (const marketAddress of marketAddresses) {
    const marketBalances = await web3.eth.getAccountBalances(marketAddress);
    balances = formatter.sum([balances, marketBalances]);
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
