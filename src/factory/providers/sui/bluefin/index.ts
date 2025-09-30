import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';
import BigNumber from 'bignumber.js';
import axios from 'axios';
import basicUtil from '../../../../util/basicUtil';
import suiTokens from '../../../../constants/tokens/sui.json';

const MARKETS_CONTAINER =
  '0x2326d387ba8bb7d24aa4cfa31f9a1e58bf9234b097574afb06c5dfb267df4c2e';
const BLUEFIN_POOLS_API =
  'https://swap.api.sui-prod.bluefin.io/api/v1/pools/info?limit=1000';

const DATA_STORE_ID =
  '0x740d972ea066fe3302ee655163373cda2e9529bfa93d2266e1355cf56899da57';
const BLUE_VAULT_ID =
  '0xe567f041b313134fdd241c57cb10cfc5b54ca36cc91643308c34bbbafefd960a';
const USDC_VAULT_ID =
  '0x10d48e112b92c8af207c1850225284a7ca46bac1d935c4af4cf87ce29b121694';

async function getAlphalendBalances(
  web3: any,
): Promise<{ [key: string]: string }> {
  const balances = {};

  const marketData = await web3.getDynamicFieldObjects({
    parent: MARKETS_CONTAINER,
    idFilter: (i: any) => i.objectType.includes('::market::Market'),
  });

  for (const market of marketData) {
    const { fields } = market;
    if (!fields) continue;

    const coinType = '0x' + fields.value.fields.coin_type.fields.name;
    const balance = new BigNumber(fields.value.fields.balance_holding);

    if (balance.isGreaterThan(0)) {
      formatter.merge(balances, coinType, balance.toFixed(0));
    }
  }

  return balances;
}

async function getSpotBalances(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  let poolsData;
  try {
    const response = await axios.get(BLUEFIN_POOLS_API);
    poolsData = response.data;
    await basicUtil.saveIntoCache(
      poolsData,
      'spotBalancesPoolsData.json',
      'sui',
      'bluefin',
    );
  } catch (e) {
    log.error({
      message: `Issue with Bluefin API`,
      stack: e.stack,
      detail: `Error: getSpotBalances of sui/bluefin`,
      endpoint: 'getSpotBalances',
    });
    poolsData = await basicUtil.readFromCache(
      'spotBalancesPoolsData.json',
      'sui',
      'bluefin',
    );
  }

  const pools = poolsData.map((i: any) => i.address);

  for (const poolAddress of pools) {
    try {
      const apiPool = poolsData.find((p: any) => p.address === poolAddress);

      const coinA = apiPool.tokenA.info.address;
      const coinB = apiPool.tokenB.info.address;
      const balanceA = new BigNumber(apiPool.tokenA.amount);
      const balanceB = new BigNumber(apiPool.tokenB.amount);

      if (balanceA.isGreaterThan(0)) {
        formatter.merge(balances, coinA, balanceA.toFixed(0));
      }
      if (balanceB.isGreaterThan(0)) {
        formatter.merge(balances, coinB, balanceB.toFixed(0));
      }
    } catch (error) {
      continue;
    }
  }

  return balances;
}

async function getProBalances(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  const dataStoreObject = await web3.getObject(DATA_STORE_ID);
  const usdcVaultObject = await web3.getObject(USDC_VAULT_ID);
  const blueVaultObject = await web3.getObject(BLUE_VAULT_ID);

  // Extract vault amounts
  const usdcVaultAmount = new BigNumber(
    usdcVaultObject.total_locked_amount || 0,
  );
  const blueVaultAmount = new BigNumber(
    blueVaultObject.total_locked_amount || 0,
  );

  // Get bank ID and fetch dynamic field
  const bankID = dataStoreObject.asset_bank?.fields?.id?.id;

  if (bankID) {
    const assetBank = await web3.getDynamicFieldObject(bankID, 'USDC', {
      idType: '0x1::string::String',
    });

    const tvlAmount = new BigNumber(assetBank.fields?.value || 0);

    if (tvlAmount.isGreaterThan(0)) {
      formatter.merge(balances, suiTokens.USDC_CIRCLE, tvlAmount.toFixed(0));
    }
  }

  if (usdcVaultAmount.isGreaterThan(0)) {
    formatter.merge(
      balances,
      suiTokens.USDC_CIRCLE,
      usdcVaultAmount.toFixed(0),
    );
  }

  if (blueVaultAmount.isGreaterThan(0)) {
    formatter.merge(balances, suiTokens.BLUE, blueVaultAmount.toFixed(0));
  }

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const alphalendBalances = await getAlphalendBalances(web3);
    balances = formatter.sum([balances, alphalendBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: `Error: getAlphalendBalances`,
      endpoint: 'getAlphalendBalances',
    });
  }

  try {
    const spotBalances = await getSpotBalances(web3);
    balances = formatter.sum([balances, spotBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: `Error: getSpotBalances`,
      endpoint: 'getSpotBalances',
    });
  }

  try {
    const proBalances = await getProBalances(web3);
    balances = formatter.sum([balances, proBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: `Error: getProBalances`,
      endpoint: 'getProBalances',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
