import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';

const EVENT_FILTER =
  '0x70285592c97965e811e0c6f98dccc3a9c2b4ad854b3594faab9597ada267b860::create_pool::PoolCreatedEvent';

async function getMomentumTVL(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  const poolIds = await web3.queryEvents({
    eventType: EVENT_FILTER,
    transform: (i: any) => i.pool_id,
  });

  const pools = [];
  for (const poolId of poolIds) {
    try {
      const pool = await web3.getObject(poolId);
      pools.push(pool);
    } catch (error) {
      continue;
    }
  }

  pools.forEach((pool: any) => {
    const token0 = '0x' + pool.type_x.fields.name;
    const token1 = '0x' + pool.type_y.fields.name;

    if (pool.reserve_x && pool.reserve_x !== '0') {
      formatter.merge(balances, token0, pool.reserve_x);
    }
    if (pool.reserve_y && pool.reserve_y !== '0') {
      formatter.merge(balances, token1, pool.reserve_y);
    }
  });

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const momentumBalances = await getMomentumTVL(web3);
    balances = formatter.sum([balances, momentumBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: `Error: getMomentumTVL`,
      endpoint: 'getMomentumTVL',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
