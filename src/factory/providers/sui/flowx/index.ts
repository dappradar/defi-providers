import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';

const FLOWX_V2_POOL_PARENT_ID =
  '0xd15e209f5a250d6055c264975fee57ec09bf9d6acdda3b5f866f76023d1563e6';
const FLOWX_V3_POOL_PARENT_ID =
  '0x27565d24a4cd51127ac90e4074a841bbe356cca7bf5759ddc14a975be1632abc';

async function getV2Balances(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  try {
    const poolInfo = await web3.getDynamicFieldObjects({
      parent: FLOWX_V2_POOL_PARENT_ID,
    });

    poolInfo.forEach((pool) => {
      const { reserve_x, reserve_y } = pool.value.fields;

      const tokenXType = reserve_x.type.replace('>', '').split('<')[1];
      const tokenYType = reserve_y.type.replace('>', '').split('<')[1];

      formatter.merge(balances, tokenXType, reserve_x.fields.balance);
      formatter.merge(balances, tokenYType, reserve_y.fields.balance);
    });
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching FlowX V2 balances',
      endpoint: 'getV2Balances',
    });
  }

  return balances;
}

async function getV3Balances(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  try {
    const rawPoolInfos = await web3.getDynamicFieldObjects({
      parent: FLOWX_V3_POOL_PARENT_ID,
    });

    rawPoolInfos.forEach((pool) => {
      const { reserve_x, reserve_y, coin_type_x, coin_type_y } = pool;

      const nameX = coin_type_x?.fields?.name;
      const nameY = coin_type_y?.fields?.name;

      if (nameX && reserve_x) {
        const tokenX = nameX.startsWith('0x') ? nameX : '0x' + nameX;
        formatter.merge(balances, tokenX, reserve_x);
      }

      if (nameY && reserve_y) {
        const tokenY = nameY.startsWith('0x') ? nameY : '0x' + nameY;
        formatter.merge(balances, tokenY, reserve_y);
      }
    });
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching FlowX V3 balances',
      endpoint: 'getV3Balances',
    });
  }

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const v2Balances = await getV2Balances(web3);
    balances = formatter.sum([balances, v2Balances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error: getV2Balances',
      endpoint: 'getV2Balances',
    });
  }

  try {
    const v3Balances = await getV3Balances(web3);
    balances = formatter.sum([balances, v3Balances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error: getV3Balances',
      endpoint: 'getV3Balances',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
