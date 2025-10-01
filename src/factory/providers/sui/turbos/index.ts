import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';

const POOL_FACTORY_CONFIG =
  '0xc294552b2765353bcafa7c359cd28fd6bc237662e5db8f09877558d81669170c';

async function getTurbosBalances(
  web3: any,
): Promise<{ [key: string]: string }> {
  const balances = {};

  const parent = await web3.getObject(POOL_FACTORY_CONFIG);

  log.info({
    message: 'Turbos pool factory config object response',
    detail: JSON.stringify(parent, null, 2),
    endpoint: 'getTurbosBalances',
  });

  const poolFields = await web3.getDynamicFieldObjects({
    parent: parent.pools.fields.id.id,
  });

  log.info({
    message: 'Turbos pool fields response',
    detail: JSON.stringify(poolFields, null, 2),
    endpoint: 'getTurbosBalances',
  });

  const poolIds = poolFields.map((item: any) => item.value.fields.pool_id);
  const poolList = await web3.getObjects(poolIds);

  log.info({
    message: 'Turbos pool list response',
    detail: JSON.stringify(poolList, null, 2),
    endpoint: 'getTurbosBalances',
  });

  poolList.forEach(({ type, fields }: any) => {
    const [coinA, coinB] = type.replace('>', '').split('<')[1].split(', ');

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
    const turbosBalances = await getTurbosBalances(web3);
    balances = formatter.sum([balances, turbosBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching Turbos TVL',
      endpoint: 'tvl',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
