/*==================================================
  Modules
  ==================================================*/

const util = require("../../sdk/util");

/*==================================================
  Settings
  ==================================================*/

const CONTRACTS = [
  "0x330bdFADE01eE9bF63C209Ee33102DD334618e0a", // 10 AVAX
  "0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD", // 100 AVAX
  "0xaf8d1839c3c67cf571aa74B5c12398d4901147B3", // 500 AVAX
];
const START_BLOCK = 4429830;

/*==================================================
  TVL
  ==================================================*/

async function tvl(block) {
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const bnbBalances = await util.getBalancesOfHolders(CONTRACTS, block);
  util.sumMultiBalanceOf(balances, bnbBalances);

  util.convertBalancesToFixed(balances);
  return balances;
}

/*==================================================
  Exports
  ==================================================*/

module.exports = {
  tvl,
};
