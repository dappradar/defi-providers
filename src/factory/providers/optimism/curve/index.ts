import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import curve from '../../../../util/calculators/curve';
import { WMAIN_ADDRESS } from '../../../../constants/contracts.json';

const START_BLOCK = 3465832;
const FACTORY = '0x2db0e83599a91b508ac268a6197b8b14f5e72840';
const E_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

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

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
