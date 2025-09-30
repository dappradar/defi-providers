import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';
import BigNumber from 'bignumber.js';
import suiTokens from '../../../../constants/tokens/sui.json';

const SCALLOP_SUI_MARKET_ID =
  '0xa757975255146dc9686aa823b7838b507f315d704f428cbadad2f4ea061939d9';

async function getScallopTvl(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  const marketObject = await web3.getObject(SCALLOP_SUI_MARKET_ID);

  const balanceSheetsTableId =
    marketObject.vault.fields.balance_sheets.fields.table.fields.id.id;

  const balanceSheetsFields = await web3.getDynamicFieldObjects({
    parent: balanceSheetsTableId,
  });

  const balanceSheetIds = balanceSheetsFields.map((e: any) => e.fields.id.id);
  const balanceSheets = await web3.getObjects(balanceSheetIds);

  balanceSheets.forEach((sheet: any) => {
    const coinType = '0x' + sheet.fields.name.fields.name;
    const cash = new BigNumber(sheet.fields.value.fields.cash);
    const revenue = new BigNumber(sheet.fields.value.fields.revenue);
    const amount = cash.minus(revenue);

    if (amount.isGreaterThan(0)) {
      formatter.merge(balances, coinType, amount.toFixed(0));
    }
  });

  const collateralStatsTableId =
    marketObject.collateral_stats.fields.table.fields.id.id;

  const collateralStatsFields = await web3.getDynamicFieldObjects({
    parent: collateralStatsTableId,
  });

  const collateralStatIds = collateralStatsFields.map(
    (e: any) => e.fields.id.id,
  );
  const collateralStats = await web3.getObjects(collateralStatIds);

  collateralStats.forEach((stat: any) => {
    const coinType = '0x' + stat.fields.name.fields.name;
    const amount = new BigNumber(stat.fields.value.fields.amount);

    if (amount.isGreaterThan(0)) {
      formatter.merge(balances, coinType, amount.toFixed(0));
    }
  });

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const scallopBalances = await getScallopTvl(web3);
    balances = formatter.sum([balances, scallopBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: `Error: getScallopTvl`,
      endpoint: 'getScallopTvl',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
