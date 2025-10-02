import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';
import BigNumber from 'bignumber.js';

const XCETUS_MANAGER_ID =
  '0x838b3dbade12b1e602efcaf8c8b818fae643e43176462bf14fd196afa59d1d9d';
const CETUS_TOKEN_ADDRESS =
  '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS';
const POOL_OBJECT_ID =
  '0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0';

async function getStakingBalances(
  web3: any,
): Promise<{ [key: string]: string }> {
  const balances = {};

  const xCetusManagerInfo = await web3.getObject(XCETUS_MANAGER_ID);

  log.info({
    message: 'Processing Cetus staking balances',
    endpoint: 'getStakingBalances',
  });

  if (xCetusManagerInfo?.treasury?.fields?.total_supply?.fields?.value) {
    const cetusAmount = new BigNumber(
      xCetusManagerInfo.treasury.fields.total_supply.fields.value,
    );

    log.info({
      message: `Cetus staking amount: ${cetusAmount.toFixed(0)}`,
      endpoint: 'getStakingBalances',
    });

    if (cetusAmount.isGreaterThan(0)) {
      formatter.merge(balances, CETUS_TOKEN_ADDRESS, cetusAmount.toFixed(0));
    }
  } else {
    log.info({
      message: 'No Cetus staking data found',
      endpoint: 'getStakingBalances',
    });
  }

  return balances;
}

async function getAmmBalances(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  const poolObject = await web3.getObject(POOL_OBJECT_ID);
  const listObjectId = poolObject.list.fields.id.id;
  const dynamicFields = await web3.getDynamicFieldObjects({
    parent: listObjectId,
  });
  const poolIds = dynamicFields.map(
    (item: any) => item.value.fields.value.fields.pool_id,
  );
  const poolInfos = await web3.getObjects(poolIds);

  log.info({
    message: `Processing ${poolInfos.length} Cetus AMM pools`,
    endpoint: 'getAmmBalances',
  });

  let poolsWithBalances = 0;
  poolInfos.forEach((poolInfo: any) => {
    const typeStr = poolInfo.type;
    const fields = poolInfo.fields;
    const [coinA, coinB] = typeStr.split('<')[1].replace('>', '').split(', ');

    let hasBalance = false;
    if (fields.coin_a && new BigNumber(fields.coin_a).isGreaterThan(0)) {
      formatter.merge(balances, coinA, fields.coin_a);
      hasBalance = true;
    }
    if (fields.coin_b && new BigNumber(fields.coin_b).isGreaterThan(0)) {
      formatter.merge(balances, coinB, fields.coin_b);
      hasBalance = true;
    }
    if (hasBalance) poolsWithBalances++;
  });

  log.info({
    message: `Found balances in ${poolsWithBalances}/${poolInfos.length} pools`,
    endpoint: 'getAmmBalances',
  });
  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const stakingBalances = await getStakingBalances(web3);
    balances = formatter.sum([balances, stakingBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: `Error: getStakingBalances`,
      endpoint: 'getStakingBalances',
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
