/*==================================================
  Modules
  ==================================================*/

const fs = require("fs");
const util = require("../../sdk/util");
const REGISTRY_ABI = require("./abis/provider_registry.json");
const PROVIDER_ABI = require("./abis/provider.json");
const DATA_PROVIDER_ABI = require("./abis/data_provider.json");
const ATOKEN_ABI = require("./abis/atoken.json");

/*==================================================
  Settings
  ==================================================*/

const V2_PROVIDER_REGISTRY = "0x4235E22d9C3f28DCDA82b58276cb6370B01265C2";
const V3_PROVIDER_REGISTRY = "0x770ef9f4fe897e59daCc474EF11238303F9552b6";
const DATA_PROVIDER_ADDRESSES = ["0x69fa688f1dc47d4b5d8029d5a35fb7a548310654"];

/*==================================================
  TVL
  ==================================================*/

async function tvl(block) {
  if (block < 4606878) {
    return {};
  }

  const results = await util.executeCallOfMultiTargets(
    [V2_PROVIDER_REGISTRY, V3_PROVIDER_REGISTRY],
    REGISTRY_ABI,
    "getAddressesProvidersList",
    [],
    block
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
    "getAddress",
    ["0x0100000000000000000000000000000000000000000000000000000000000000"],
    block
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
    "getAllATokens",
    [],
    block
  );

  let aTokens = {};
  try {
    aTokens = JSON.parse(
      fs.readFileSync("./providers/avalanceh_aave/aTokens.json", "utf8")
    );
  } catch {}

  const aTokenAddresses = [];
  aTokenMarkets.forEach((markets) => {
    if (markets) {
      markets.forEach((market) => {
        if (market) {
          const address =
            typeof market == "string"
              ? market.split(",")[1].toLowerCase()
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
      "UNDERLYING_ASSET_ADDRESS",
      []
    );

    underlyings.forEach((underlying, index) => {
      if (underlying) {
        aTokens[newATokens[index]] = underlying.toLowerCase();
      }
    });

    fs.writeFile(
      "./providers/avalanche_aave/aTokens.json",
      JSON.stringify(aTokens, null, 2),
      "utf8",
      function (err) {
        if (err) {
          console.error(err);
        }
      }
    );
  }

  const tokenBalances = await util.getTokenBalancesOfHolders(
    aTokenAddresses,
    aTokenAddresses.map((address) => aTokens[address]),
    block
  );

  const balances = {};
  util.sumMultiBalanceOf(balances, tokenBalances);
  util.convertBalancesToFixed(balances);

  console.log(balances);

  return balances;
}

/*==================================================
  Exports
  ==================================================*/

module.exports = {
  tvl,
};
