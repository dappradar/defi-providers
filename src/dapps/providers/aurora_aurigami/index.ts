/*==================================================
  Modules
  ==================================================*/

import unitroller from '../../sdk/helpers/unitroller';
import util from '../../sdk/util';

/*==================================================
  Settings
  ==================================================*/

const START_BLOCK = 60501454;
const UNITROLLER_ADDRESSES = ['0x817af6cfaf35bdc1a634d6cc94ee9e4c68369aeb'];

/*==================================================
  TVL
  ==================================================*/

async function tvl(params) {
  const { block, chain, provider } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const balances = await unitroller.getTvl(
    UNITROLLER_ADDRESSES,
    block,
    chain,
    provider,
  );

  util.convertBalancesToFixed(balances);
  return { balances };
}

/*==================================================
  Exports
  ==================================================*/

export { tvl };
