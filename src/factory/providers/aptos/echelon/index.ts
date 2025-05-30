import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';

const aptosLendingContract =
  '0xc6bc659f1649553c1a3fa05d9727433dc03843baac29473c817d06d39e7621ba';
const movementLendingContract =
  '0x6a01d5761d43a5b5a0ccbfc42edf2d02c0611464aae99a2ea0e0d4819f0550b5';
const echelonChainLendingContract =
  '0xedcdbb4c459064293924e0e96e01d5927faa11fd38d331111d99d23f14f6ed7d';
const coinAssetType = '300';
const echelonRESTEndpoint =
  'https://rest-echelon-1.anvil.asia-southeast.initia.xyz';

async function _getResource(
  account: string,
  key: string,
  chain: string,
  web3: any,
) {
  if (chain === 'aptos' || chain === 'move') {
    return web3.eth.getResource(account, key);
  } else {
    const url = `${echelonRESTEndpoint}/initia/move/v1/accounts/${account}/resources/by_struct_tag?struct_tag=${key}`;
    const { data } = await axios.get(url);
    const moveResourceObject = data.resource.move_resource;
    const parsedObject = JSON.parse(moveResourceObject);
    return parsedObject.data;
  }
}

async function getMarketAddresses(network: string, web3: any) {
  let lendingAddress: string;
  switch (network) {
    case 'aptos':
      lendingAddress = aptosLendingContract;
      break;
    case 'move':
      lendingAddress = movementLendingContract;
      break;
    default:
      lendingAddress = echelonChainLendingContract;
  }
  const lending = await _getResource(
    lendingAddress,
    `${lendingAddress}::lending::Lending`,
    network,
    web3,
  );
  return lending.market_objects.map((obj: any) => obj.inner);
}

async function getMarket(network: string, marketAddress: string, web3: any) {
  let lendingAddress: string;
  switch (network) {
    case 'aptos':
      lendingAddress = aptosLendingContract;
      break;
    case 'move':
      lendingAddress = movementLendingContract;
      break;
    default:
      lendingAddress = echelonChainLendingContract;
  }
  const market = await _getResource(
    marketAddress,
    `${lendingAddress}::lending::Market`,
    network,
    web3,
  );
  let coinInfo = null;
  if (market.asset_type === coinAssetType) {
    coinInfo = (
      await _getResource(
        marketAddress,
        `${lendingAddress}::lending::CoinInfo`,
        network,
        web3,
      )
    ).type_name;
  } else {
    coinInfo = (
      await _getResource(
        marketAddress,
        `${lendingAddress}::lending::FungibleAssetInfo`,
        network,
        web3,
      )
    ).metadata.inner;
  }

  return {
    cash: market.total_cash,
    liability: market.total_liability,
    fee: market.total_reserve,
    coin: coinInfo,
  };
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};

  try {
    const marketAddresses = await getMarketAddresses(chain, web3);
    const markets = await Promise.all(
      marketAddresses.map((marketAddress: string) =>
        getMarket(chain, marketAddress, web3),
      ),
    );

    markets.forEach(({ cash, coin }) => {
      if (coin && cash !== '0') {
        formatter.merge(balances, coin, cash);
      }
    });
  } catch (error) {
    console.log('Error fetching Echelon data:', error);
  }

  formatter.mapAptosTokenAddresses(balances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
