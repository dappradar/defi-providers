import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const HYPERION_POOL_ADDRESS =
  '0x8b4a2c4bb53857c718a04c020b98f8c2e1f99a68b0f57389a8bf5434cd22e05c';

async function getPoolInfo(web3: any, offset: number, limit: number) {
  const poolInfo = await web3.eth.functionView({
    functionStr: `${HYPERION_POOL_ADDRESS}::pool_v3::all_pools_with_info`,
    args: [String(offset), String(limit)],
    type_arguments: [],
  });

  return poolInfo;
}

async function getCoinInfo(web3: any, faType: string) {
  try {
    const coinInfo = await web3.eth.functionView({
      functionStr: '0x1::coin::paired_coin',
      args: [faType],
      type_arguments: [],
    });

    if (
      coinInfo &&
      coinInfo[0] &&
      coinInfo[0].vec &&
      coinInfo[0].vec.length > 0
    ) {
      const coinData = coinInfo[0].vec[0];
      const address = coinData.account_address;
      const module = Buffer.from(
        coinData.module_name.replace('0x', ''),
        'hex',
      ).toString('utf-8');
      const struct = Buffer.from(
        coinData.struct_name.replace('0x', ''),
        'hex',
      ).toString('utf-8');

      return address + '::' + module + '::' + struct;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

async function getAllPoolInfo(web3: any) {
  let offset = 0;
  const limit = 100;
  let poolInfo = [];
  let [data, pager] = await getPoolInfo(web3, offset, limit);

  if (data.length !== 0) {
    poolInfo = poolInfo.concat(data);
  }

  while (offset + limit < pager.total) {
    offset += limit;
    [data, pager] = await getPoolInfo(web3, offset, limit);
    poolInfo = poolInfo.concat(data);
  }

  return poolInfo;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};

  try {
    const poolInfo = await getAllPoolInfo(web3);

    for (const pool of poolInfo) {
      const coin1 =
        (await getCoinInfo(web3, pool.token_a.inner)) || pool.token_a.inner;
      const coin2 =
        (await getCoinInfo(web3, pool.token_b.inner)) || pool.token_b.inner;

      if (coin1 && pool.token_a_reserve && pool.token_a_reserve !== '0') {
        formatter.merge(balances, coin1, pool.token_a_reserve);
      }

      if (coin2 && pool.token_b_reserve && pool.token_b_reserve !== '0') {
        formatter.merge(balances, coin2, pool.token_b_reserve);
      }
    }
  } catch (error) {
    console.log('Error fetching Hyperion data:', error);
  }

  formatter.mapAptosTokenAddresses(balances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
