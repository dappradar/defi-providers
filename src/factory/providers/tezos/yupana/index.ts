import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const START_BLOCK = 2595000;
const YUPANA_CORE = 'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec';
const WRAPPED_TEZOS = 'KT1UpeXdK6AJbX58GJ92pLZVCucn2DR8Nu4b_0';
const CTEZ = 'KT1SjXiUX63QvdNMcM2m492f7kuf8JxXRLp4_0';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};
  const tokenBalances = await web3.eth.getAllTokensBalances(YUPANA_CORE, block);

  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);

  if (balances[WRAPPED_TEZOS]) {
    balances['xtz'] = balances[WRAPPED_TEZOS];
    delete balances[WRAPPED_TEZOS];
  }
  if (balances[CTEZ]) {
    balances['xtz'] = BigNumber(balances['xtz'] || 0).plus(balances[CTEZ]);
    delete balances[CTEZ];
  }

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
