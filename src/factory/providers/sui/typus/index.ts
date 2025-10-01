import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';
import BigNumber from 'bignumber.js';

const SINGLE_DEPOSIT_VAULT_REGISTRY =
  '0xd67cf93a0df61b4b3bbf6170511e0b28b21578d9b87a8f4adafec96322dd284d';
const REFUND_VAULT_REGISTRY =
  '0xf9acfc0a06094f6515c4392ffef84d40cd5f1d72bc74cbde3ee99dd7bca6cf3f';
const FUD_TOKEN =
  '0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1::fud::FUD';
const V1_SINGLE_DEPOSIT_VAULT_REGISTRY =
  '0x4ae62c4d67f9f5d7077626fcc6d450535c4df710da455a0a2bd2226558832629';
const V1_SINGLE_BID_VAULT_REGISTRY =
  '0x2c8cdd00ced47e717420cd2fc54990b3b38e115e34a9209271063a59ddeeb059';

const LIQUIDITY_POOL_0 =
  '0x98110aae0ffaf294259066380a2d35aba74e42860f1e87ee9c201f471eb3ba03';
const SAFU_REGISTRY =
  '0xdc970d638d1489385e49ddb76889748011bac4616b95a51aa63633972b841706';
const FUNDING_VAULT_REGISTRY =
  '0xeb9e1c94b72cd3e1a4ca2e4d6e9dd61547c0c45c654843e0db03c50ba3c21138';
const HEDGE_VAULT_REGISTRY =
  '0x515bb299ca2f0c8b753411f6e52322c03516915f522096890a314adac6c39a0a';

async function getDovBalances(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  const depositVaults = await web3.getDynamicFieldObjects({
    parent: SINGLE_DEPOSIT_VAULT_REGISTRY,
  });

  depositVaults.forEach((fields: any) => {
    const depositToken = '0x' + fields.deposit_token.fields.name;
    const bidToken = '0x' + fields.bid_token.fields.name;

    if (depositToken.endsWith('MFUD')) {
      const activeSupply = new BigNumber(
        fields.active_share_supply,
      ).multipliedBy(10 ** 5);
      const deactivatingSupply = new BigNumber(
        fields.deactivating_share_supply,
      ).multipliedBy(10 ** 5);
      const inactiveSupply = new BigNumber(
        fields.inactive_share_supply,
      ).multipliedBy(10 ** 5);
      const warmupSupply = new BigNumber(
        fields.warmup_share_supply,
      ).multipliedBy(10 ** 5);

      formatter.merge(balances, FUD_TOKEN, activeSupply.toString());
      formatter.merge(balances, FUD_TOKEN, deactivatingSupply.toString());
      formatter.merge(balances, FUD_TOKEN, inactiveSupply.toString());
      formatter.merge(balances, FUD_TOKEN, warmupSupply.toString());
    } else {
      formatter.merge(balances, depositToken, fields.active_share_supply);
      formatter.merge(balances, depositToken, fields.deactivating_share_supply);
      formatter.merge(balances, depositToken, fields.inactive_share_supply);
      formatter.merge(balances, depositToken, fields.warmup_share_supply);
    }

    if (bidToken.endsWith('MFUD')) {
      const premiumSupply = new BigNumber(
        fields.premium_share_supply,
      ).multipliedBy(10 ** 5);
      formatter.merge(balances, FUD_TOKEN, premiumSupply.toString());
    } else {
      formatter.merge(balances, bidToken, fields.premium_share_supply);
    }
  });

  const v1DepositVaultFields = await web3.getDynamicFieldObjects({
    parent: V1_SINGLE_DEPOSIT_VAULT_REGISTRY,
  });

  v1DepositVaultFields.forEach((item: any) => {
    const typeStr = item.value.type;
    const coinMatch = typeStr.match(/, ([^>]+)>$/);
    const coin = coinMatch ? coinMatch[1] : '';
    const fields = item.value.fields;
    formatter.merge(balances, coin, fields.active_sub_vault.fields.balance);
    formatter.merge(
      balances,
      coin,
      fields.deactivating_sub_vault.fields.balance,
    );
    formatter.merge(balances, coin, fields.inactive_sub_vault.fields.balance);
    formatter.merge(balances, coin, fields.warmup_sub_vault.fields.balance);
  });

  const v1BidVaultFields = await web3.getDynamicFieldObjects({
    parent: V1_SINGLE_BID_VAULT_REGISTRY,
  });

  v1BidVaultFields.forEach((item: any) => {
    const typeStr = item.value.type;
    const coinMatch = typeStr.match(/, ([^>]+)>$/);
    const coin = coinMatch ? coinMatch[1] : '';
    const fields = item.value.fields;
    formatter.merge(balances, coin, fields.bidder_sub_vault.fields.balance);
    formatter.merge(balances, coin, fields.premium_sub_vault.fields.balance);
    formatter.merge(
      balances,
      coin,
      fields.performance_fee_sub_vault.fields.balance,
    );
  });

  const refundVaultFields = await web3.getDynamicFieldObjects({
    parent: REFUND_VAULT_REGISTRY,
  });

  refundVaultFields.forEach((fields: any) => {
    const token = '0x' + fields.token.fields.name;
    formatter.merge(balances, token, fields.share_supply);
  });

  return balances;
}

async function getPerpBalances(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  const pool = await web3.getObject(LIQUIDITY_POOL_0);

  pool.token_pools.forEach((pool: any) => {
    const token = '0x' + pool.fields.token_type.fields.name;
    formatter.merge(balances, token, pool.fields.state.fields.liquidity_amount);
  });

  return balances;
}

async function getSafuBalances(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  const fields = await web3.getDynamicFieldObjects({
    parent: SAFU_REGISTRY,
  });

  const safuVaults = fields.filter((item: any) => item.deposit_token);

  safuVaults.forEach((vault: any) => {
    const depositToken = '0x' + vault.deposit_token.fields.name;
    formatter.merge(balances, depositToken, vault.share_supply[0]);
  });

  const fields2 = await web3.getDynamicFieldObjects({
    parent: FUNDING_VAULT_REGISTRY,
  });

  const safuFundingVaults = fields2.filter((item: any) => item.token);

  safuFundingVaults.forEach((vault: any) => {
    const depositToken = '0x' + vault.token.fields.name;
    formatter.merge(balances, depositToken, vault.info[1]);
  });

  const fields3 = await web3.getDynamicFieldObjects({
    parent: HEDGE_VAULT_REGISTRY,
  });

  const hedgeVaults = fields3.filter(
    (item: any) => item.main_token && item.hedge_token,
  );

  hedgeVaults.forEach((vault: any) => {
    const amounts = vault.user_share_supply;
    const mainToken = '0x' + vault.main_token.fields.name;
    const hedgeToken = '0x' + vault.hedge_token.fields.name;
    const mainAmount = amounts[0] + amounts[2] + amounts[4] + amounts[6];
    const hedgeAmount = amounts[1] + amounts[3] + amounts[5] + amounts[7];
    formatter.merge(balances, mainToken, mainAmount.toString());
    formatter.merge(balances, hedgeToken, hedgeAmount.toString());
  });

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const dovBalances = await getDovBalances(web3);
    balances = formatter.sum([balances, dovBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching Typus DOV balances',
      endpoint: 'tvl',
    });
  }

  try {
    const perpBalances = await getPerpBalances(web3);
    balances = formatter.sum([balances, perpBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching Typus Perp balances',
      endpoint: 'tvl',
    });
  }

  try {
    const safuBalances = await getSafuBalances(web3);
    balances = formatter.sum([balances, safuBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching Typus SAFU balances',
      endpoint: 'tvl',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
