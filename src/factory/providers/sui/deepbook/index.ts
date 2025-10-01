import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';
import axios from 'axios';
import basicUtil from '../../../../util/basicUtil';

const ASSETS_URL = 'https://deepbook-indexer.mainnet.mystenlabs.com/assets';
const ENDPOINT_URL = 'https://deepbook-indexer.mainnet.mystenlabs.com';
const ENDPOINT_NAME = 'get_net_deposits';

async function getDeepBookBalances(): Promise<{ [key: string]: string }> {
  const balances = {};

  let assetsData;
  try {
    const response = await axios.get(ASSETS_URL);
    assetsData = response.data;
    await basicUtil.saveIntoCache(
      assetsData,
      'deepbookAssetsData.json',
      'sui',
      'deepbook',
    );

    log.info({
      message: 'DeepBook assets API response',
      detail: JSON.stringify(assetsData, null, 2),
      endpoint: 'getDeepBookBalances',
    });
  } catch (e) {
    log.error({
      message: `Issue with DeepBook assets API`,
      stack: e.stack,
      detail: `Error: getDeepBookBalances assets fetch`,
      endpoint: 'getDeepBookBalances',
    });
    assetsData = await basicUtil.readFromCache(
      'deepbookAssetsData.json',
      'sui',
      'deepbook',
    );
  }

  if (!assetsData) {
    return balances;
  }

  const coins = Object.values(assetsData).map((a: any) => a.asset_type);
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const url = `${ENDPOINT_URL}/${ENDPOINT_NAME}/${coins.join(
    ',',
  )}/${currentTimestamp}`;

  let depositsData;
  try {
    const response = await axios.get(url);
    depositsData = response.data;
    await basicUtil.saveIntoCache(
      depositsData,
      'deepbookDepositsData.json',
      'sui',
      'deepbook',
    );

    log.info({
      message: 'DeepBook net deposits API response',
      detail: JSON.stringify(depositsData, null, 2),
      endpoint: 'getDeepBookBalances',
    });
  } catch (e) {
    log.error({
      message: `Issue with DeepBook net deposits API`,
      stack: e.stack,
      detail: `Error: getDeepBookBalances deposits fetch for URL: ${url}`,
      endpoint: 'getDeepBookBalances',
    });
    depositsData = await basicUtil.readFromCache(
      'deepbookDepositsData.json',
      'sui',
      'deepbook',
    );
  }

  if (!depositsData) {
    return balances;
  }

  coins.forEach((coin: string) => {
    if (depositsData[coin]) {
      const amount = depositsData[coin];
      if (amount && Number(amount) > 0) {
        formatter.merge(balances, coin, amount.toString());
      }
    }
  });

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const {} = params;
  let balances = {};

  try {
    const deepbookBalances = await getDeepBookBalances();
    balances = formatter.sum([balances, deepbookBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching DeepBook TVL',
      endpoint: 'tvl',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
