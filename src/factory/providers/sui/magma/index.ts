import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';

const POOL_OBJECT_ID =
  '0xfa145b9de10fe858be81edd1c6cdffcf27be9d016de02a1345eb1009a68ba8b2';

async function getMagmaBalances(web3: any): Promise<{ [key: string]: string }> {
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

  poolInfos.forEach((poolInfo: any) => {
    const typeStr = poolInfo.type;
    const fields = poolInfo.fields;
    const [coinA, coinB] = typeStr.replace('>', '').split('<')[1].split(', ');

    if (fields.coin_a && fields.coin_a !== '0') {
      formatter.merge(balances, coinA, fields.coin_a);
    }
    if (fields.coin_b && fields.coin_b !== '0') {
      formatter.merge(balances, coinB, fields.coin_b);
    }
  });

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const magmaBalances = await getMagmaBalances(web3);
    balances = formatter.sum([balances, magmaBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching Magma TVL',
      endpoint: 'tvl',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
