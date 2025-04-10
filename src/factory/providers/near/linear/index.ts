import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 61147683;
const LINEAR_CONTRACT = 'linear-protocol.near';
const REF_FINANCE_CONTRACT = 'v2.ref-finance.near';
const WRAP_NEAR_ADDRESS = 'wrap.near';
const LINEAR_NEAR_POOL_ID = 3088;

async function convertLinearToNear(
  linearBalance: string,
  web3: any,
  block: number,
): Promise<string> {
  try {
    const pool = await web3.eth.callContractFunction(
      REF_FINANCE_CONTRACT,
      'get_pool',
      { pool_id: LINEAR_NEAR_POOL_ID },
      block,
    );

    if (!pool || !pool.token_account_ids || pool.token_account_ids.length < 2) {
      return linearBalance;
    }

    const linearIndex = pool.token_account_ids.indexOf(LINEAR_CONTRACT);
    const wrapNearIndex = pool.token_account_ids.indexOf(WRAP_NEAR_ADDRESS);

    if (
      linearIndex >= 0 &&
      wrapNearIndex >= 0 &&
      BigNumber(pool.amounts[linearIndex]).gt(0)
    ) {
      const linearToNearRatio = BigNumber(pool.amounts[wrapNearIndex]).div(
        BigNumber(pool.amounts[linearIndex]),
      );

      return BigNumber(linearBalance).times(linearToNearRatio).toFixed();
    }

    return linearBalance; // Return original balance if conversion is not possible
  } catch (error) {
    console.error('Error converting LINEAR to NEAR:', error);
    return linearBalance; // Return original balance in case of error
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const linearBalance = await web3.eth.callContractFunction(
    LINEAR_CONTRACT,
    'get_total_staked_balance',
    {},
    block,
  );

  balances[LINEAR_CONTRACT] = linearBalance;

  const nearEquivalent = await convertLinearToNear(linearBalance, web3, block);

  if (nearEquivalent !== linearBalance) {
    delete balances[LINEAR_CONTRACT];
    balances[WRAP_NEAR_ADDRESS] = nearEquivalent;
  }

  return { balances };
}

export { tvl };
