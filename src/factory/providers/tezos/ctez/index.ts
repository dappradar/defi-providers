import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const START_BLOCK = 2062236;
const OVEN_FACTORY = 'KT1GWnsoFZVHGh7roXEER3qeCcgJgrXT3de2';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = { xtz: '0' };

  const ovenRegistry = new web3.eth.Contract(null, OVEN_FACTORY);
  await ovenRegistry.init();

  const ovens = await ovenRegistry.methods.getBigmap('ovens').call(null, block);

  ovens.map((oven) => {
    balances['xtz'] = BigNumber(balances['xtz'])
      .plus(oven.value.tez_balance)
      .toFixed();
  });

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
