/*==================================================
  Modules
  ==================================================*/

import util from '../../sdk/util';

/*==================================================
  Settings
  ==================================================*/

const START_BLOCK = 15388422;
const VAULT = '0xd5a8f233cbddb40368d55c3320644fb36e597002';
const TOKENS = ['0x7f5c764cbc14f9669b88837ca1490cca17c31607'];

/*==================================================
  TVL
  ==================================================*/

async function tvl(params) {
  const { block, chain } = params;

  if (block < START_BLOCK) {
    return {};
  }
  const balances = {};
  const balanceResults = await util.getTokenBalances(
    VAULT,
    TOKENS,
    block,
    chain,
  );

  util.sumMultiBalanceOf(balances, balanceResults);
  util.convertBalancesToFixed(balances);

  console.log(balances, balances);
  return { balances };
}

/*==================================================
  Exports
  ==================================================*/

export { tvl };
