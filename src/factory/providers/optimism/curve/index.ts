/*==================================================
  Modules
  ==================================================*/

import BigNumber from 'bignumber.js';
import util from '../../../sdk/util';
import curve from '../../../sdk/helpers/curve';
import { WMAIN_ADDRESS } from '../../../sdk/constants/contracts.json';

/*==================================================
  Settings
  ==================================================*/

const START_BLOCK = 3465832;
const FACTORY = '0x2db0e83599a91b508ac268a6197b8b14f5e72840';
const E_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

/*==================================================
  TVL
  ==================================================*/

async function tvl(params) {
  const { block, chain, provider } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const balances = await curve.getTvl(FACTORY, block, chain, provider);

  if (balances[E_ADDRESS]) {
    balances[WMAIN_ADDRESS.optimism] = BigNumber(
      balances[WMAIN_ADDRESS.optimism] || 0,
    )
      .plus(balances[E_ADDRESS])
      .toFixed();
    delete balances[E_ADDRESS];
  }

  util.convertBalancesToFixed(balances);
  return { balances };
}

/*==================================================
  Exports
  ==================================================*/

export { tvl };
