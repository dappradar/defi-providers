import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 62303110;
const BURROW_CONTRACT = 'contract.main.burrow.near';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const assetsCallResponse = await web3.eth.callContractFunction(
    BURROW_CONTRACT,
    'get_assets_paged',
    {},
    block,
  );
  const balances = {};
  assetsCallResponse.forEach(([token, asset]) => {
    const extraDecimals = asset.config.extra_decimals;
    const amount = BigNumber(asset.supplied.balance)
      .plus(BigNumber(asset.reserved))
      .minus(BigNumber(asset.borrowed.balance));
    const adjustedAmount = amount.shiftedBy(-1 * extraDecimals);
    balances[token] = adjustedAmount.toString();
  });

  return { balances };
}

export { tvl };
