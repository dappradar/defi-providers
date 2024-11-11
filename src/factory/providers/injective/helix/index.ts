import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import BigNumber from 'bignumber.js';
import { getNetworkInfo, Network } from '@injectivelabs/networks';
import {
  IndexerGrpcDerivativesApi,
  protoObjectToJson,
  IndexerGrpcSpotApi,
} from '@injectivelabs/sdk-ts';

const MARKET_STATUS = 'active';
const CHUNK_SIZE = 30;

async function getBalances(
  balanceType: 'spot' | 'derivatives',
): Promise<{ [key: string]: BigNumber }> {
  const network = getNetworkInfo(Network.Mainnet);
  const indexerApi =
    balanceType === 'derivatives'
      ? new IndexerGrpcDerivativesApi(network.indexer)
      : new IndexerGrpcSpotApi(network.indexer);

  const markets = await indexerApi
    .fetchMarkets({
      marketStatus: MARKET_STATUS,
    })
    .then((response) => JSON.parse(protoObjectToJson(response)));
  const marketIds: string[] = markets.map((i) => i.marketId);

  const orders = [];
  for (let i = 0; i < marketIds.length; i += CHUNK_SIZE) {
    const chunk = marketIds.slice(i, i + CHUNK_SIZE);
    const chunkOrders = await indexerApi.fetchOrderbooksV2(chunk);
    orders.push(...chunkOrders);
  }

  const marketObj: { [key: string]: any } = {};
  for (const market of markets) {
    marketObj[market.marketId] = market;
  }

  for (const order of orders) {
    if (marketObj[order.marketId]) {
      marketObj[order.marketId].orderbook = order.orderbook;
    }
  }

  const balances: { [key: string]: BigNumber } = {};
  for (const { quoteDenom, baseDenom, orderbook } of markets) {
    const { buys, sells } = orderbook || { buys: [], sells: [] };

    for (const { price, quantity } of buys) {
      balances[quoteDenom] = new BigNumber(balances[quoteDenom] || 0).plus(
        new BigNumber(quantity).multipliedBy(price),
      );
    }

    for (const { quantity } of sells) {
      if (balanceType === 'spot') {
        balances[baseDenom] = new BigNumber(balances[baseDenom] || 0).plus(
          quantity,
        );
      } else if (balanceType === 'derivatives') {
        const firstBuyPrice = buys.length ? buys[0].price : 0;
        balances[quoteDenom] = new BigNumber(balances[quoteDenom] || 0).plus(
          new BigNumber(quantity).multipliedBy(firstBuyPrice),
        );
      }
    }
  }

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const spotBalances = await getBalances('spot');
  const derivativeBalances = await getBalances('derivatives');
  const balances = formatter.sum([spotBalances, derivativeBalances]);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
