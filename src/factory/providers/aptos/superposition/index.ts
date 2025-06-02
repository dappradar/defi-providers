import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const SP_ROOT_ADDRESS =
  '0xccd1a84ccea93531d7f165b90134aa0415feb30e8757ab1632dac68c0055f5c2';

let _resourcesCache: Promise<any[]> | null = null;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};

  try {
    if (!_resourcesCache) {
      _resourcesCache = web3.eth.getResources(SP_ROOT_ADDRESS);
    }
    const resources = await _resourcesCache;

    const brokers = resources.filter((i: any) =>
      i.type.includes(`${SP_ROOT_ADDRESS}::broker::Broker`),
    );

    const coinToFungibleAssetArray = resources.filter((i: any) =>
      i.type.includes(`${SP_ROOT_ADDRESS}::map::Map`),
    );

    const coinToFungibleAssetMap = coinToFungibleAssetArray.reduce(function (
      map,
      item,
    ) {
      map[item.type] = item.data.fa_metadata;
      return map;
    },
    {} as any);

    brokers.forEach((item: any) => {
      const { type, data } = item;
      const coinType = type.match(/<([^>]+)>/)[1];

      let tokenMint = coinType;
      const mapType = `${SP_ROOT_ADDRESS}::map::Map<${coinType}>`;
      if (mapType in coinToFungibleAssetMap) {
        tokenMint = coinToFungibleAssetMap[mapType];
      }

      const available = parseInt(data.available);
      if (tokenMint && available && available !== 0) {
        formatter.merge(balances, tokenMint, available);
      }
    });
  } catch (error) {
    console.log('Error fetching Superposition data:', error);
  }

  formatter.mapAptosTokenAddresses(balances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
