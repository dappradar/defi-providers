import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 45752813;
const REF_FINANCE_CONTRACT = 'v2.ref-finance.near';
const PROJECT_DCL_CONTRACT = 'dclv2.ref-labs.near';
const BURROW_CONTRACT = 'contract.main.burrow.near';
const LINEAR_ADDRESS = 'linear-protocol.near';
const WRAP_NEAR_ADDRESS = 'wrap.near';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  // Get DCL pools
  const allDclPools = await web3.eth.callContractFunction(
    PROJECT_DCL_CONTRACT,
    'list_pools',
    {},
    block,
  );

  allDclPools.forEach((dclPoolDetail) => {
    const { token_x, token_y, total_order_x, total_order_y, total_x, total_y } =
      dclPoolDetail;
    balances[token_x] = BigNumber(balances[token_x] || 0)
      .plus(BigNumber(total_order_x).plus(total_x))
      .toFixed();
    balances[token_y] = BigNumber(balances[token_y] || 0)
      .plus(BigNumber(total_order_y).plus(total_y))
      .toFixed();
  });

  // Get REF Finance pools
  const numberOfPools = await web3.eth.callContractFunction(
    REF_FINANCE_CONTRACT,
    'get_number_of_pools',
    {},
    block,
  );

  let poolIndex = 0;
  let linearToUsdtRatio = null;

  while (poolIndex < numberOfPools) {
    const pools = await web3.eth.callContractFunction(
      REF_FINANCE_CONTRACT,
      'get_pools',
      {
        from_index: poolIndex,
        limit: 500,
      },
      block,
    );

    pools
      .filter(({ shares_total_supply }) => +shares_total_supply > 0)
      .map(({ token_account_ids, pool_kind, amounts }) => {
        token_account_ids.forEach((token, index) => {
          balances[token] = BigNumber(balances[token] || 0)
            .plus(amounts[index])
            .toFixed();
        });
        if (
          token_account_ids.includes(LINEAR_ADDRESS) &&
          token_account_ids.includes(WRAP_NEAR_ADDRESS)
        ) {
          const linearIndex = token_account_ids.indexOf(LINEAR_ADDRESS);
          const usdtIndex = token_account_ids.indexOf(WRAP_NEAR_ADDRESS);

          // Calculate the ratio of USDT to LINEAR
          if (BigNumber(amounts[linearIndex]).gt(0)) {
            linearToUsdtRatio = BigNumber(amounts[usdtIndex]).div(
              BigNumber(amounts[linearIndex]),
            );
          }
        }
      });

    poolIndex += 500;
  }

  // Get Burrow lending data (non-borrowed assets only)
  const assetsCallResponse = await web3.eth.callContractFunction(
    BURROW_CONTRACT,
    'get_assets_paged',
    {},
    block,
  );

  assetsCallResponse.forEach(([token, asset]) => {
    const extraDecimals = asset.config.extra_decimals;
    const amount = BigNumber(asset.supplied.balance)
      .plus(BigNumber(asset.reserved))
      .minus(BigNumber(asset.borrowed.balance));
    const adjustedAmount = amount.shiftedBy(-1 * extraDecimals);

    balances[token] = BigNumber(balances[token] || 0)
      .plus(adjustedAmount)
      .toFixed();
  });

  // Convert LINEAR to WRAP.NEAR if we have a ratio and LINEAR balance exists
  if (linearToUsdtRatio && balances[LINEAR_ADDRESS]) {
    const linearBalance = BigNumber(balances[LINEAR_ADDRESS]);
    const usdtEquivalent = linearBalance.times(linearToUsdtRatio);

    balances[WRAP_NEAR_ADDRESS] = BigNumber(balances[WRAP_NEAR_ADDRESS] || 0)
      .plus(usdtEquivalent)
      .toFixed();

    // Remove LINEAR from the balances
    delete balances[LINEAR_ADDRESS];
  }

  return { balances };
}

export { tvl };
