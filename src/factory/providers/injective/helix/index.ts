import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';
import formatter from '../../../../util/formatter';
import BigNumber from 'bignumber.js';
import { getNetworkInfo, Network } from '@injectivelabs/networks';
import {
  IndexerGrpcDerivativesApi,
  protoObjectToJson,
} from '@injectivelabs/sdk-ts';

const MARKET_TYPE = 'DERIVATIVES';
const MARKET_STATUS = 'active';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};

  const network = getNetworkInfo(Network.Mainnet);
  const indexerGrpcDerivativesApi = new IndexerGrpcDerivativesApi(
    network.indexer,
  );

  const markets = await indexerGrpcDerivativesApi
    .fetchMarkets({
      marketStatus: MARKET_STATUS,
    })
    .then((response) => JSON.parse(protoObjectToJson(response)));

  const marketIds: string[] = markets.map((i) => i.marketId);
  const orders = await indexerGrpcDerivativesApi.fetchOrderbooksV2(marketIds);
  console.log(orders);
  console.log('orders', orders.length);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
