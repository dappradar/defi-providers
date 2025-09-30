import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';
import { log } from '../../../../util/logger/logger';
import suiTokens from '../../../../constants/tokens/sui.json';

const SUILEND_LENDING_MARKET_ID =
  '0x84030d26d85eaa7035084a057f2f11f701b7e2e4eda87551becbc7c97505ece1';
const LST_CREATE_EVENT_TYPE =
  '0xb0575765166030556a6eafd3b1b970eba8183ff748860680245b9edd41c716e7::events::Event<0xb0575765166030556a6eafd3b1b970eba8183ff748860680245b9edd41c716e7::liquid_staking::CreateEvent>';
const SPRINGSUI_STAKING_CONTRACT =
  '0x15eda7330c8f99c30e430b4d82fd7ab2af3ead4ae17046fcb224aa9bad394f6b';
const EXCLUDE_LST_POOL_IDS = [
  '0x15eda7330c8f99c30e430b4d82fd7ab2af3ead4ae17046fcb224aa9bad394f6b',
];
const SUI_FULL_ADDRESS =
  '0x0000000000000000000000000000000000000000000000000000000000000002::sui::sui';

async function getRedemptionRates(
  web3: any,
): Promise<{ [key: string]: BigNumber }> {
  const events = await web3.queryEvents({
    eventType: LST_CREATE_EVENT_TYPE,
  });

  const coinTypeToRate: { [key: string]: BigNumber } = {};

  for (const event of events) {
    const coinType = '0x' + event.event.typename.name;
    if (coinType === suiTokens.SPRINGSUI_ADDRESS) {
      continue;
    }

    const poolId = event.event.liquid_staking_info_id;
    try {
      const data = await web3.getObject(poolId);
      const totalSupply = new BigNumber(
        data.lst_treasury_cap.fields.total_supply.fields.value,
      );
      const stakedSui = new BigNumber(data.storage.fields.total_sui_supply);

      if (totalSupply.isZero()) {
        continue;
      }

      coinTypeToRate[coinType] = stakedSui.dividedBy(totalSupply);
    } catch (e) {
      continue;
    }
  }

  return coinTypeToRate;
}

async function getProtocolBalances(
  web3: any,
): Promise<{ [key: string]: string }> {
  const balances = {};
  const redemptionRates = await getRedemptionRates(web3);
  const object = await web3.getObject(SUILEND_LENDING_MARKET_ID);

  for (const reserve of object.reserves) {
    const coinType = '0x' + reserve.fields.coin_type.fields.name;
    const availableAmount = reserve.fields.available_amount;

    if (availableAmount && availableAmount !== '0') {
      if (redemptionRates[coinType]) {
        const suiAmount =
          redemptionRates[coinType].multipliedBy(availableAmount);
        formatter.merge(balances, suiTokens.SUI, suiAmount.toFixed(0));
      } else {
        formatter.merge(balances, coinType, availableAmount);
      }
    }
  }

  return balances;
}

async function getSpringsuiStakingBalances(
  web3: any,
): Promise<{ [key: string]: string }> {
  const balances = {};
  const pool = await web3.getObject(SPRINGSUI_STAKING_CONTRACT);
  const suiAmount = new BigNumber(pool.storage.fields.total_sui_supply);

  formatter.merge(balances, suiTokens.SUI, suiAmount.toFixed(0));
  return balances;
}

async function getEcosystemLSTBalances(
  web3: any,
): Promise<{ [key: string]: string }> {
  const balances = {};

  const events = await web3.queryEvents({
    eventType: LST_CREATE_EVENT_TYPE,
  });

  const poolIds = events
    .map((i) => i.event.liquid_staking_info_id)
    .filter((id) => !EXCLUDE_LST_POOL_IDS.includes(id));

  let totalSuiAmount = new BigNumber(0);
  for (const poolId of poolIds) {
    try {
      const pool = await web3.getObject(poolId);
      if (!pool) continue;
      const suiAmount = new BigNumber(pool.storage.fields.total_sui_supply);
      totalSuiAmount = totalSuiAmount.plus(suiAmount);
    } catch (error) {
      continue;
    }
  }

  formatter.merge(balances, suiTokens.SUI, totalSuiAmount.toFixed(0));
  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const protocolBalances = await getProtocolBalances(web3);
    balances = formatter.sum([balances, protocolBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching Suilend protocol data',
      endpoint: 'getProtocolBalances',
    });
  }

  try {
    const springsuiBalances = await getSpringsuiStakingBalances(web3);
    balances = formatter.sum([balances, springsuiBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching SpringSUI staking data',
      endpoint: 'getSpringsuiStakingBalances',
    });
  }

  try {
    const ecosystemLSTBalances = await getEcosystemLSTBalances(web3);
    balances = formatter.sum([balances, ecosystemLSTBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching ecosystem LST data',
      endpoint: 'getEcosystemLSTBalances',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
