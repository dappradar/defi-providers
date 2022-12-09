/*==================================================
  Modules
  ==================================================*/

const BigNumber = require("bignumber.js");
const calculate = require("../octusbridge/calculate");

/*==================================================
  Settings
  ==================================================*/

const CONVERT = {
  "0x1ffefd8036409cb6d652bd610de465933b226917": {
    coingecko: "coingecko_everscale",
    decimals: 9,
  },
};

/*==================================================
  TVL
  ==================================================*/

async function tvl(block) {
  if (block < 13851414) {
    return {};
  }

  const balances = await calculate.tvl(block, "AVALANCHE");

  for (const token in balances) {
    if (CONVERT[token]) {
      balances[CONVERT[token].coingecko] = BigNumber(balances[token])
        .div(10 ** CONVERT[token].decimals)
        .toFixed();
      delete balances[token];
    }
  }

  return balances;
}

/*==================================================
  Exports
  ==================================================*/

module.exports = {
  tvl,
};
