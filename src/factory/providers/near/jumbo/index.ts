import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 59518297;
const JUMBO_CONTRACT = 'v1.jumbo_exchange.near';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const numberOfPools = await web3.eth.callContractFunction(
    JUMBO_CONTRACT,
    'get_number_of_pools',
    {},
    block,
  );

  let fromIndex = 0;
  while (fromIndex < numberOfPools) {
    const pools = await web3.eth.callContractFunction(
      JUMBO_CONTRACT,
      'get_pools',
      {
        from_index: fromIndex,
        limit: 100,
      },
      block,
    );
    pools
      .filter(({ shares_total_supply }) => +shares_total_supply > 0)
      .map(({ token_account_ids, pool_kind, amounts }) => {
        if (['SIMPLE_POOL', 'STABLE_SWAP', 'RATED_SWAP'].includes(pool_kind)) {
          token_account_ids.forEach((token, index) => {
            balances[token] = BigNumber(balances[token] || 0)
              .plus(amounts[index])
              .toFixed();
          });
        }
      });
    fromIndex += 100;
  }
  return { balances };
}

export { tvl };
