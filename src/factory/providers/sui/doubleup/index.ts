import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';
import suiTokens from '../../../../constants/tokens/sui.json';

const UNI_HOUSE_OBJ_ID =
  '0x75c63644536b1a7155d20d62d9f88bf794dc847ea296288ddaf306aa320168ab';
const BUCK = suiTokens.BUCK;
const UPUSD =
  '0x5de877a152233bdd59c7269e2b710376ca271671e9dd11076b1ff261b2fd113c::up_usd::UP_USD';
const UPUSD_FACTORY =
  '0x35507cec814a779e23393aa8e17746c51e38fb5efa18afdc8434a670da4d3338';

async function getUnihouseBalances(
  web3: any,
): Promise<{ [key: string]: string }> {
  const balances = {};

  try {
    const unihouseDynamicFields = await web3.getDynamicFieldObjects({
      parent: UNI_HOUSE_OBJ_ID,
    });

    const houseObjects = unihouseDynamicFields?.filter(
      (field) =>
        field.house_pipe_debt &&
        field.house_pool &&
        field.pipe_debt &&
        field.pool,
    );

    for (const house of houseObjects) {
      const housePipeDebt = house?.house_pipe_debt?.fields?.value;
      const housePool = house?.house_pool;
      const houseTvl = Number(housePipeDebt || 0) + Number(housePool || 0);

      const pipeDebt = house?.pipe_debt?.fields?.value;
      const poolAmount = house?.pool;
      const _tvl = Number(pipeDebt || 0) + Number(poolAmount || 0);

      const totalTvl = houseTvl + _tvl;

      if (totalTvl > 0) {
        const houseDebtType = house?.house_pipe_debt?.type;
        const poolDebtType = house?.pipe_debt?.type;

        let coinType = null;

        if (houseDebtType) {
          const match = houseDebtType.match(/HouseDebt<([^>]+)>/);
          coinType = match?.[1];
        }

        if (!coinType && poolDebtType) {
          const match = poolDebtType.match(/PoolDebt<([^>]+)>/);
          coinType = match?.[1];
        }

        if (coinType && coinType !== UPUSD) {
          formatter.merge(balances, coinType, totalTvl.toString());
        }
      }
    }
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching Unihouse balances',
      endpoint: 'getUnihouseBalances',
    });
  }

  return balances;
}

async function getUpusdBalances(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  try {
    const upusd_factory = await web3.getObject(UPUSD_FACTORY);

    const buck_tvl = upusd_factory?.underlying_balance;

    if (buck_tvl && buck_tvl !== '0') {
      formatter.merge(balances, BUCK, buck_tvl);
    }
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching UPUSD balances',
      endpoint: 'getUpusdBalances',
    });
  }

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const unihouseBalances = await getUnihouseBalances(web3);
    balances = formatter.sum([balances, unihouseBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching DoubleUp Unihouse TVL',
      endpoint: 'getUnihouseBalances',
    });
  }

  try {
    const upusdBalances = await getUpusdBalances(web3);
    balances = formatter.sum([balances, upusdBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching DoubleUp UPUSD TVL',
      endpoint: 'getUpusdBalances',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
