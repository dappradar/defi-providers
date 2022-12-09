/*==================================================
  Modules
  ==================================================*/

const fs = require("fs");
const util = require("../../sdk/util");
const ABI = require("./abi.json");

/*==================================================
  Settings
  ==================================================*/

const ROUTER = "0x45A01E4e04F14f7A4a6702c74187c5F6222033cd";

/*==================================================
  TVL
  ==================================================*/

async function tvl(block) {
  if (block < 12215178) {
    return {};
  }

  let store = {
    pools: [],
    tokens: {},
  };
  try {
    store = JSON.parse(
      fs.readFileSync("./providers/avalanche_stargate/store.json", "utf8")
    );
  } catch {}

  const factory = await util.executeCall(ROUTER, ABI, "factory", [], block);
  const allPoolsLength = await util.executeCall(
    factory,
    ABI,
    "allPoolsLength",
    [],
    block
  );

  if (store.pools.length < allPoolsLength) {
    const newPools = await util.executeMultiCallsOfTarget(
      factory,
      ABI,
      "allPools",
      Array.from(
        { length: allPoolsLength - store.pools.length },
        (_, i) => store.pools.length + i
      ),
      block
    );
    const poolTokens = await util.executeCallOfMultiTargets(
      newPools,
      ABI,
      "token",
      [],
      block
    );

    for (const index in newPools) {
      if (newPools[index] && poolTokens[index]) {
        store.pools.push(newPools[index]);
        store.tokens[newPools[index]] = poolTokens[index];
      } else {
        break;
      }
    }

    fs.writeFile(
      "./providers/avalanche_stargate/store.json",
      JSON.stringify(store, null, 2),
      "utf8",
      function (err) {
        if (err) {
          console.error(err);
        }
      }
    );
  }

  const tokenBalances = await util.getTokenBalancesOfHolders(
    Object.keys(store.tokens),
    Object.values(store.tokens),
    block
  );

  let balances = {};

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
