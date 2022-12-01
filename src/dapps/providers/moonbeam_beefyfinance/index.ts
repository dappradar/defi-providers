/*==================================================
  Modules
  ==================================================*/

import beefyfinance from '../../sdk/helpers/beefyfinance';

/*==================================================
  Settings
  ==================================================*/

const START_BLOCK = 380863;

/*==================================================
  TVL
  ==================================================*/

async function tvl(params) {
  const { block, chain, provider } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const balances = await beefyfinance.getTvl(block, chain, provider);

  return { balances };
}

/*==================================================
    Exports
    ==================================================*/

export { tvl };
