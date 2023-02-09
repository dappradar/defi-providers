import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 64440978;
const STRIMING_CONTRACT = 'streaming.r-v2.near';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const tokens: object = (
    await web3.eth.callContractFunction(
      STRIMING_CONTRACT,
      'get_stats',
      { account_id: STRIMING_CONTRACT },
      block,
    )
  )['dao_tokens'];

  for (const [key, value] of Object.entries(tokens)) {
    balances[key] = value.tvl;
  }

  return { balances };
}

export { tvl };
