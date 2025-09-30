import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';
import BigNumber from 'bignumber.js';
import suiTokens from '../../../../constants/tokens/sui.json';

const STAKED_SUI_VAULT_STATE_V1_OBJECT_ID =
  '0x55486449e41d89cfbdb20e005c1c5c1007858ad5b4d5d7c047d2b3b592fe8791';
const CREATED_POOL_EVENT_TYPE =
  '0xefe170ec0be4d762196bedecd7a065816576198a6527c99282a2551aaa7da38c::events::CreatedPoolEvent';

async function getAfsuiBalances(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  const stakedSuiVaultState = await web3.getObject(
    STAKED_SUI_VAULT_STATE_V1_OBJECT_ID,
  );

  const totalSuiAmount = new BigNumber(
    stakedSuiVaultState.total_sui_amount || 0,
  );
  const atomicUnstakeSuiReserves = new BigNumber(
    stakedSuiVaultState.atomic_unstake_sui_reserves || 0,
  );
  const crankIncentiveRewardPool = new BigNumber(
    stakedSuiVaultState.crank_incentive_reward_pool || 0,
  );

  const totalSui = totalSuiAmount
    .plus(atomicUnstakeSuiReserves)
    .plus(crankIncentiveRewardPool);

  if (totalSui.isGreaterThan(0)) {
    formatter.merge(balances, suiTokens.SUI, totalSui.toFixed(0));
  }

  return balances;
}

async function getAmmBalances(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  const poolIds = await web3.queryEvents({
    eventType: CREATED_POOL_EVENT_TYPE,
    transform: (event: any) => event.pool_id,
  });

  const poolData = await web3.getObjects(poolIds);

  poolData.forEach((pool: any) => {
    const fields = pool.fields;
    const tokens = fields.type_names;
    const balances_raw = fields.normalized_balances;
    const decimalScalars = fields.decimal_scalars;

    balances_raw.forEach((balance: string, index: number) => {
      const token = tokens[index];

      if (/af_lp::AF_LP/.test(token)) {
        return;
      }

      const tokenAddress = '0x' + token;
      const decimalScalar = new BigNumber(decimalScalars[index]);
      const normalizedBalance = new BigNumber(balance).dividedBy(decimalScalar);

      if (normalizedBalance.isGreaterThan(0)) {
        formatter.merge(balances, tokenAddress, normalizedBalance.toFixed(0));
      }
    });
  });

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const afsuiBalances = await getAfsuiBalances(web3);
    balances = formatter.sum([balances, afsuiBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: `Error: getAfsuiBalances`,
      endpoint: 'getAfsuiBalances',
    });
  }

  try {
    const ammBalances = await getAmmBalances(web3);
    balances = formatter.sum([balances, ammBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: `Error: getAmmBalances`,
      endpoint: 'getAmmBalances',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
