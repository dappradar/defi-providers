import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';
import suiTokens from '../../../../constants/tokens/sui.json';
import BigNumber from 'bignumber.js';

const RESERVE_DYNAMIC_TABLE =
  '0x6ce8b223c47b5037d6791819694b32619ab0edfa5da139d21e416781cae487aa';

const DECIMAL_SHIFTS = {
  [suiTokens.USDC_CIRCLE]: -2,
  [suiTokens.SUI]: 1,
};

const SUI_TOKENS = [
  { symbol: 'SUI', poolId: 3, address: suiTokens.SUI },
  { symbol: 'USDC', poolId: 8, address: suiTokens.USDC_CIRCLE },
];

async function fetchDataBasedOnPoolId(web3: any) {
  const promises = SUI_TOKENS.map(async ({ poolId }) => {
    return await web3.getDynamicFieldObject(
      RESERVE_DYNAMIC_TABLE,
      poolId.toString(),
      {
        idType: 'u16',
      },
    );
  });

  return Promise.all(promises);
}

function calculateAndAdd(
  objectsList: any[],
  type: string,
  indexName: string,
  balances: { [key: string]: string },
) {
  objectsList.forEach((object, index) => {
    const { address } = SUI_TOKENS[index];

    const dataFields = object?.value?.fields;

    const total_supply = new BigNumber(
      dataFields?.otoken_scaled?.fields?.total_supply || '0',
    );
    const total_borrow = new BigNumber(
      dataFields?.dtoken_scaled?.fields?.total_supply || '0',
    );
    const indexValue = new BigNumber(dataFields?.[indexName] || '0');

    const shiftValue = new BigNumber(10).pow(DECIMAL_SHIFTS[address] ?? 0);
    const mainValue =
      type === 'tvl' ? total_supply.minus(total_borrow) : total_borrow;

    const amount = mainValue
      .multipliedBy(shiftValue)
      .multipliedBy(indexValue)
      .dividedBy(new BigNumber(10).pow(27))
      .toNumber();


    if (amount > 0) {
      formatter.merge(balances, address, amount.toString());
    }
  });
}

async function getOmniBTCTvl(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  try {
    const objectsList = await fetchDataBasedOnPoolId(web3);
    calculateAndAdd(objectsList, 'tvl', 'current_liquidity_index', balances);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching OmniBTC TVL',
      endpoint: 'getOmniBTCTvl',
    });
  }

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const omniBTCBalances = await getOmniBTCTvl(web3);
    balances = formatter.sum([balances, omniBTCBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching OmniBTC TVL',
      endpoint: 'tvl',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
