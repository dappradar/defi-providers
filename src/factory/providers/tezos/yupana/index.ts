import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const START_BLOCK = 2595000;
const YUPANA_CORE = 'KT1Rk86CX85DjBKmuyBhrCyNsHyudHVtASec';
const WRAPPED_TEZOS = 'KT1UpeXdK6AJbX58GJ92pLZVCucn2DR8Nu4b';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};
  const tokenBalances = await web3.eth.getAllTokensBalances(YUPANA_CORE, block);

  formatter.sumMultiBalanceOf(balances, tokenBalances);

  if (balances[WRAPPED_TEZOS]) {
    balances['xtz'] = balances[WRAPPED_TEZOS];
    delete balances[WRAPPED_TEZOS];
  }

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
