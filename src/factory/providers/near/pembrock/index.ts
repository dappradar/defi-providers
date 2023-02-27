import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 70717960;
const PEMBROCK_CONTRACT = 'v1.pembrock.near';
const REF_FINANCE_CONTRACT = 'v2.ref-finance.near';
const BOOSTFARM_CONTRACT = 'boostfarm.ref-labs.near';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const tokens = await web3.eth.callContractFunction(
    PEMBROCK_CONTRACT,
    'get_tokens',
    {
      account_id: PEMBROCK_CONTRACT,
    },
    block,
  );
  const farms: { ref_pool_id: number }[] = await web3.eth.callContractFunction(
    PEMBROCK_CONTRACT,
    'get_farms',
    {},
    block,
  );
  const seeds = await web3.eth.callContractFunction(
    BOOSTFARM_CONTRACT,
    'list_farmer_seeds',
    {
      farmer_id: PEMBROCK_CONTRACT,
    },
    block,
  );

  for (const token of Object.keys(tokens)) {
    balances[token] = await web3.eth.callContractFunction(
      token,
      'ft_balance_of',
      { account_id: PEMBROCK_CONTRACT },
      block,
    );
  }

  for (const farm of Object.values(farms)) {
    const [pool, nonStakedShares] = await Promise.all([
      web3.eth.callContractFunction(
        REF_FINANCE_CONTRACT,
        'get_pool',
        {
          pool_id: farm.ref_pool_id,
        },
        block,
      ),
      web3.eth.callContractFunction(
        REF_FINANCE_CONTRACT,
        'mft_balance_of',
        {
          token_id: `:${farm.ref_pool_id}`,
          account_id: PEMBROCK_CONTRACT,
        },
        block,
      ),
    ]);
    const seed = seeds[`${REF_FINANCE_CONTRACT}@${farm.ref_pool_id}`];

    if (seed) {
      const shares = BigNumber(nonStakedShares)
        .plus(seed.free_amount)
        .plus(seed.locked_amount);

      const firstTokenAmount = shares
        .multipliedBy(pool.amounts[0])
        .dividedBy(pool.shares_total_supply);
      const secondTokenAmount = shares
        .multipliedBy(pool.amounts[1])
        .dividedBy(pool.shares_total_supply);

      balances[pool.token_account_ids[0]] = BigNumber(
        balances[pool.token_account_ids[0]] || 0,
      ).plus(firstTokenAmount);
      balances[pool.token_account_ids[1]] = BigNumber(
        balances[pool.token_account_ids[1]] || 0,
      ).plus(secondTokenAmount);
    }
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
