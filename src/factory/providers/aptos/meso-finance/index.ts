import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const MESO_ADDRESS =
  '0x68476f9d437e3f32fd262ba898b5e3ee0a23a1d586a6cf29a28add35f253f6f7';

let _poolData: Promise<any[]> | null = null;

function getPoolData(web3: any) {
  if (!_poolData) {
    _poolData = new Promise(fetchPoolData);
  }

  return _poolData;

  async function fetchPoolData(
    resolve: (value: any[]) => void,
    reject: (reason?: any) => void,
  ) {
    try {
      const poolAddresses = await getPoolAddresses();
      const poolInfos = await Promise.all(poolAddresses.map(getPoolInfo));
      resolve(poolInfos);
    } catch (e) {
      reject(e);
    }
  }

  async function getPoolAddresses() {
    const pools = await web3.eth.functionView({
      functionStr: `${MESO_ADDRESS}::meso::pools`,
      args: [],
      type_arguments: [],
    });

    if (!pools || !Array.isArray(pools) || pools.length === 0) {
      return [];
    }

    const poolsData = pools[0];

    if (!poolsData.data) {
      return [];
    }

    return poolsData.data.map((obj: any) => ({
      coin: obj.key,
      poolAddress: obj.value.inner,
    }));
  }

  async function getPoolInfo(pool: any) {
    const poolInfoResponse = await web3.eth.functionView({
      functionStr: `${MESO_ADDRESS}::lending_pool::pool_info`,
      args: [pool.poolAddress],
      type_arguments: [],
    });

    const [poolInfo] = poolInfoResponse;

    return {
      coin: pool.coin,
      poolSupply: poolInfo.total_reserves,
      totalDebt: poolInfo.total_debt,
    };
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};

  try {
    const poolInfos = await getPoolData(web3);

    poolInfos.forEach(({ coin, poolSupply }) => {
      if (coin && poolSupply && poolSupply !== '0') {
        formatter.merge(balances, coin, poolSupply);
      }
    });
  } catch (error) {
    console.log('Error fetching Meso Finance data:', error);
  }

  formatter.mapAptosTokenAddresses(balances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
