import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';
import BigNumber from 'bignumber.js';
import suiTokens from '../../../../constants/tokens/sui.json';

const VOLO_NATIVE_POOL_ID =
  '0x7fa2faa111b8c65bea48a23049bfd81ca8f971a262d981dcd9a17c3825cb5baf';
const NAVI_STORAGE_ID =
  '0xbb4e2f4b6205c2e2a2db47aeb4f830796ec7c005f88537ee775986639bc442fe';
const SUI_FULL_ADDRESS =
  '0x0000000000000000000000000000000000000000000000000000000000000002::sui::sui';

async function getVoloBalances(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  const nativePoolObj = await web3.getObject(VOLO_NATIVE_POOL_ID);

  const totalStakedValue = new BigNumber(
    (
      await web3.getDynamicFieldObject(
        nativePoolObj.total_staked.fields.id.id,
        nativePoolObj.staked_update_epoch,
        {
          idType: 'u64',
        },
      )
    ).value,
  ).plus(new BigNumber(nativePoolObj.pending.fields.balance));

  const totalPendingRewards = new BigNumber(nativePoolObj.total_rewards).minus(
    new BigNumber(nativePoolObj.collected_rewards),
  );

  const unstakeTicketsSupply = new BigNumber(
    nativePoolObj.ticket_metadata.fields.total_supply,
  );

  const totalStakedSui = totalStakedValue
    .plus(totalPendingRewards)
    .minus(unstakeTicketsSupply);

  formatter.merge(balances, suiTokens.SUI, totalStakedSui.toFixed(0));

  return balances;
}

async function getLendingBalances(
  web3: any,
): Promise<{ [key: string]: string }> {
  const balances = {};

  const storageObject = await web3.getObject(NAVI_STORAGE_ID);
  const reservesId = storageObject.reserves.fields.id.id;

  const dynamicFields = await web3.getDynamicFieldObjects({
    parent: reservesId,
  });

  for (const object of dynamicFields) {
    const coin = '0x' + object.fields.value.fields.coin_type;

    try {
      // Get coin metadata to determine correct decimals
      const metadata = await web3.getCoinMetadata(coin);
      if (!metadata || metadata.decimals === undefined) {
        throw new Error(`No metadata available for coin ${coin}`);
      }
      const decimals = metadata.decimals;

      const totalSupply = new BigNumber(
        object.fields.value.fields.supply_balance.fields.total_supply,
      )
        .multipliedBy(
          new BigNumber(object.fields.value.fields.current_supply_index),
        )
        .dividedBy(new BigNumber('1e27'));

      const borrowed = new BigNumber(
        object.fields.value.fields.borrow_balance.fields.total_supply,
      )
        .multipliedBy(
          new BigNumber(object.fields.value.fields.current_borrow_index),
        )
        .dividedBy(new BigNumber('1e27'));

      const netAmount = totalSupply.minus(borrowed);

      if (netAmount.isGreaterThan(0)) {
        // Apply decimal adjustment: multiply by 10^(decimals - 9) to normalize to SUI scale
        const adjustedAmount = netAmount.multipliedBy(
          new BigNumber(10).pow(decimals - 9),
        );
        formatter.merge(balances, coin, adjustedAmount.toFixed(0));
      }
    } catch (error) {
      log.error({
        message: error?.message || '',
        stack: error?.stack || '',
        detail: `Error processing coin ${coin}`,
        endpoint: 'getLendingBalances',
      });
    }
  }

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const voloBalances = await getVoloBalances(web3);
    balances = formatter.sum([balances, voloBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: `Error: getVoloBalances`,
      endpoint: 'getVoloBalances',
    });
  }

  try {
    const lendingBalances = await getLendingBalances(web3);
    balances = formatter.sum([balances, lendingBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: `Error: getLendingBalances`,
      endpoint: 'getLendingBalances',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
