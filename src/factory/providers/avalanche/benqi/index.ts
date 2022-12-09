/*==================================================
  Modules
  ==================================================*/

const fs = require("fs");
const BigNumber = require("bignumber.js");
const abi = require("./abi.json");
const util = require("../../sdk/util");
const { WMAIN_ADDRESS } = require("../../sdk/constants/contracts.json");

/*==================================================
  Settings
  ==================================================*/

const UNITROLLER_ADDRESS = "0x486af39519b4dc9a7fccd318217352830e8ad9b4";

/*==================================================
  TVL
  ==================================================*/

async function tvl(block) {
  if (block < 3046286) {
    return {};
  }

  let qiTokens = {};
  try {
    qiTokens = JSON.parse(
      fs.readFileSync("./providers/avalanche_benqi/pools.json", "utf8")
    );
  } catch {}

  const allMarkets = await util.executeCall(
    UNITROLLER_ADDRESS,
    abi,
    "getAllMarkets",
    [],
    block
  );

  const newMarkets = allMarkets.filter((market) => !qiTokens[market]);

  if (newMarkets.length > 0) {
    const underlyings = await util.executeCallOfMultiTargets(
      newMarkets,
      abi,
      "underlying",
      []
    );

    underlyings.forEach((underlying, index) => {
      qiTokens[newMarkets[index]] = (
        underlying || WMAIN_ADDRESS.avalanche
      ).toLowerCase();
    });

    fs.writeFile(
      "./providers/avalanche_benqi/pools.json",
      JSON.stringify(qiTokens, null, 2),
      "utf8",
      function (err) {
        if (err) {
          console.error(err);
        }
      }
    );
  }

  const results = await util.executeCallOfMultiTargets(
    allMarkets,
    abi,
    "getCash",
    [],
    block
  );

  const tokenBalances = [];
  results.forEach((result, index) => {
    if (result) {
      tokenBalances.push({
        token: qiTokens[allMarkets[index]],
        balance: BigNumber(result),
      });
    }
  });

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
