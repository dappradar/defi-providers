import util from '../../../../util/blockchainUtil';
import REGISTRY_ABI from './abis/provider_registry.json';
import PROVIDER_ABI from './abis/provider.json';
import DATA_PROVIDER_ABI from './abis/data_provider.json';
import ATOKEN_ABI from './abis/atoken.json';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const V2_PROVIDER_REGISTRY = '0x4235E22d9C3f28DCDA82b58276cb6370B01265C2';
const V3_PROVIDER_REGISTRY = '0x770ef9f4fe897e59daCc474EF11238303F9552b6';
const DATA_PROVIDER_ADDRESSES = ['0x69fa688f1dc47d4b5d8029d5a35fb7a548310654'];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 4606878) {
    return {};
  }

  const results = await util.executeCallOfMultiTargets(
    [V2_PROVIDER_REGISTRY, V3_PROVIDER_REGISTRY],
    REGISTRY_ABI,
    'getAddressesProvidersList',
    [],
    block,
    chain,
    web3,
  );

  const addressesProviders = [];
  results.forEach((result) => {
    if (result) {
      addressesProviders.push(...result.filter((address) => address));
    }
  });

  const dataProviders = await util.executeCallOfMultiTargets(
    addressesProviders,
    PROVIDER_ABI,
    'getAddress',
    ['0x0100000000000000000000000000000000000000000000000000000000000000'],
    block,
    chain,
    web3,
  );

  dataProviders.forEach((provider) => {
    if (
      provider &&
      provider != util.ZERO_ADDRESS &&
      !DATA_PROVIDER_ADDRESSES.includes(provider.toLowerCase())
    ) {
      DATA_PROVIDER_ADDRESSES.push(provider);
    }
  });

  const aTokenMarkets = await util.executeCallOfMultiTargets(
    DATA_PROVIDER_ADDRESSES,
    DATA_PROVIDER_ABI,
    'getAllATokens',
    [],
    block,
    chain,
    web3,
  );

  let aTokens = {};
  try {
    aTokens = await basicUtil.readFromCache(
      'cache/aTokens.json',
      chain,
      provider,
    );
  } catch {}

  const aTokenAddresses = [];
  aTokenMarkets.forEach((markets) => {
    if (markets) {
      markets.forEach((market) => {
        if (market) {
          const address =
            typeof market == 'string'
              ? market.split(',')[1].toLowerCase()
              : market[1].toLowerCase();
          if (!aTokenAddresses.includes(address)) {
            aTokenAddresses.push(address);
          }
        }
      });
    }
  });

  const newATokens = aTokenAddresses.filter((address) => !aTokens[address]);

  if (newATokens.length > 0) {
    const underlyings = await util.executeCallOfMultiTargets(
      newATokens,
      ATOKEN_ABI,
      'UNDERLYING_ASSET_ADDRESS',
      [],
      block,
      chain,
      web3,
    );

    underlyings.forEach((underlying, index) => {
      if (underlying) {
        aTokens[newATokens[index]] = underlying.toLowerCase();
      }
    });

    basicUtil.savedIntoCache(aTokens, 'cache/aTokens.json', chain, provider);
  }

  const tokenBalances = await util.getTokenBalancesOfHolders(
    aTokenAddresses,
    aTokenAddresses.map((address) => aTokens[address]),
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
