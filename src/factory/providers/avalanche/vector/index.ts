/*==================================================
  Modules
  ==================================================*/

const fs = require("fs");
const BigNumber = require("bignumber.js");
const MASTERCHEF_ABI = require("./abis/masterchef.json");
const MAINSTAKING_ABI = require("./abis/mainstaking.json");
const UNDERLYINGS = require("./underlyings.json");
const util = require("../../sdk/util");

/*==================================================
  Settings
  ==================================================*/

const MASTERCHEF = "0x423D0FE33031aA4456a17b150804aA57fc157d97";
const MAINSTAKING = "0x8B3d9F0017FA369cD8C164D0Cc078bf4cA588aE5";

/*==================================================
  TVL
  ==================================================*/

async function tvl(block) {
  if (block < 11608913) {
    return {};
  }

  let pools = {};
  try {
    pools = JSON.parse(
      fs.readFileSync("./providers/avalanche_vector/pools.json", "utf8")
    );
  } catch {}

  const poolLength = await util.executeCall(
    MASTERCHEF,
    MASTERCHEF_ABI,
    "poolLength",
    [],
    block
  );

  const newPools = Array.from({ length: poolLength }, (_, i) => i).filter(
    (poolId) => !pools[poolId]
  );

  if (newPools.length > 0) {
    const poolTokens = await util.executeMultiCallsOfTarget(
      MASTERCHEF,
      MASTERCHEF_ABI,
      "registeredToken",
      newPools,
      block
    );
    console.log(poolTokens);

    poolTokens.forEach((token, index) => {
      if (token) {
        pools[newPools[index]] = token.toLowerCase();
      }
    });

    fs.writeFile(
      "./providers/avalanche_vector/pools.json",
      JSON.stringify(pools, null, 2),
      "utf8",
      function (err) {
        if (err) {
          console.error(err);
        }
      }
    );
  }

  const results = await util.getTokenBalances(
    MASTERCHEF,
    Object.values(pools),
    block
  );

  const depositedTokens = results
    .filter((result) => result)
    .map((result) => [
      result.balance.toFixed(),
      UNDERLYINGS.MAINSTAKING[result.token],
    ])
    .filter((result) => result[1]);

  const underlyingBalances = await util.executeMultiCallsOfTarget(
    MAINSTAKING,
    MAINSTAKING_ABI,
    "getDepositTokensForShares",
    depositedTokens,
    block
  );

  const tokenBalances = {};
  util.sumMultiBalanceOf(tokenBalances, [
    ...results
      .filter((result) => result)
      .filter((result) => !UNDERLYINGS.MAINSTAKING[result.token])
      .map((result) => ({
        token: UNDERLYINGS.JOE_LP[result.token] || result.token,
        balance: result.balance,
      })),
    ...underlyingBalances.map((balance, index) => ({
      token: depositedTokens[index][1],
      balance: BigNumber(balance),
    })),
  ]);

  const balances = await util.convertToUnderlyings(tokenBalances, block);

  console.log(balances);

  return balances;
}

/*==================================================
  Exports
  ==================================================*/

module.exports = {
  tvl,
};
