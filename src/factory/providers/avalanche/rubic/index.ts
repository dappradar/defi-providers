/*==================================================
  Modules
  ==================================================*/

const util = require("../../sdk/util");

/*==================================================
    Settings
    ==================================================*/

const POOL = "0x541eC7c03F330605a2176fCD9c255596a30C00dB";
const TOKENS = [
  "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664", // USDC
];

/*==================================================
    TVL
    ==================================================*/

async function tvl(block) {
  if (block < 8872902) {
    return {};
  }

  const tokenBalances = await util.getTokenBalances(POOL, TOKENS, block);

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
