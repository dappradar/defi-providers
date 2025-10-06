import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const BLUEMOVE_ACCOUNT_1 =
  '0x3f2d9f724f4a1ce5e71676448dc452be9a6243dac9c5b975a588c8c867066e92';
const BLUEMOVE_ACCOUNT_2 =
  '0x5a7eca40df453efe6bb1feae99e5b8fc072d1252cbd1979eb187d625dc9b47c9';

const POOL_STR_1 = '::swap::Pool';
const POOL_STR_2 = 'stable_swap::Stable_Pool';

const EVENT_TYPE_1 =
  '0xb24b6789e088b876afabca733bed2299fbc9e2d6369be4d1acfa17d8145454d9::swap::Created_Pool_Event';

async function getBluemovePools(
  web3: any,
  account: string,
  poolStr: string,
  eventType?: string,
) {
  let pools = [];

  try {
    if (eventType) {
      const events = await web3.queryEvents({
        eventType,
        transform: (i: any) => i.pool_id,
      });

      if (events.length > 0) {
        pools = await web3.getObjects(events);
      }
    } else {
      pools = await web3.getDynamicFieldObjects({
        parent: account,
        idFilter: (i: any) => (poolStr ? i.objectType.includes(poolStr) : i),
      });
    }
  } catch (error) {
    return [];
  }

  return pools;
}

function getTokens(pool: any): string[] {
  const typeString = pool.type || '';
  const tokens = typeString.split('<')[1]?.replace('>', '').split(', ') || [];
  return tokens;
}

function getTokenReserves(
  pool: any,
  token0Reserve: (i: any) => any,
  token1Reserve: (i: any) => any,
) {
  const reserve0 = token0Reserve(pool);
  const reserve1 = token1Reserve(pool);
  return { reserve0, reserve1 };
}

async function getBluemoveBalances(
  web3: any,
): Promise<{ [key: string]: string }> {
  const balances = {};

  try {
    const pools1 = await getBluemovePools(
      web3,
      BLUEMOVE_ACCOUNT_1,
      POOL_STR_1,
      EVENT_TYPE_1,
    );
    const pools2 = await getBluemovePools(web3, BLUEMOVE_ACCOUNT_2, POOL_STR_2);

    const allPools = [...pools1, ...pools2];

    for (const pool of allPools) {
      if (!pool) continue;

      const [token0, token1] = getTokens(pool);

      if (token0 && token1) {
        const { reserve0, reserve1 } = getTokenReserves(
          pool,
          (i: any) => i.fields?.reserve_x || i.fields?.coin_x_reserve || 0,
          (i: any) => i.fields?.reserve_y || i.fields?.coin_y_reserve || 0,
        );

        if (reserve0 > 0 || reserve1 > 0) {
          formatter.merge(balances, token0, reserve0.toString());
          formatter.merge(balances, token1, reserve1.toString());
        }
      }
    }
  } catch (error) {
    return {};
  }

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};

  try {
    const bluemoveBalances = await getBluemoveBalances(web3);
    Object.assign(balances, bluemoveBalances);
  } catch (error) {
    return { balances };
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
