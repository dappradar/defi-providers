import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';

const ZLP_LIQUIDITY_POOL_VAULT =
  '0xd06c73706a6df247db99bab608da48abed03a5517cd32ff7c294c0691dc3dd6f';
const USDZ_LIQUIDITY_POOL_VAULT =
  '0x8c2640c37bca8ab34becd4e526425f5b01e56dc29a4f61ad8ffba6188e98f06b';
const ZBTCVC_LIQUIDITY_POOL_VAULT =
  '0xb2a69be9dae2a7bf93487003d2d42574287eeb6134e42b0879eb04e8e1f66230';
const SLP_LIQUIDITY_POOL_VAULT =
  '0x5e288c9acbb8746bb22f5d5c3af5e0ba6a7bf04fb276772c1035004f6ca98f37';

async function getPerpsBalances(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  const zlpDepositVaultFields = await web3.getDynamicFieldObjects({
    parent: ZLP_LIQUIDITY_POOL_VAULT,
  });

  const usdzDepositVaultFields = await web3.getDynamicFieldObjects({
    parent: USDZ_LIQUIDITY_POOL_VAULT,
  });

  const zbtcvcDepositVaultFields = await web3.getDynamicFieldObjects({
    parent: ZBTCVC_LIQUIDITY_POOL_VAULT,
  });

  const zlpDepositVaultIds = zlpDepositVaultFields.map(
    (item: any) => item.id.id,
  );
  const usdzDepositVaultIds = usdzDepositVaultFields.map(
    (item: any) => item.id.id,
  );
  const zbtcvcDepositVaultIds = zbtcvcDepositVaultFields.map(
    (item: any) => item.id.id,
  );

  const zlpDepositVaults = await web3.getObjects(zlpDepositVaultIds);
  const usdzDepositVaults = await web3.getObjects(usdzDepositVaultIds);
  const zbtcvcDepositVaults = await web3.getObjects(zbtcvcDepositVaultIds);

  zlpDepositVaults.forEach((vault: any) => {
    const {
      type,
      fields: {
        value: { fields },
      },
    } = vault;
    const splitPieces = type.split('<');
    const coin = splitPieces[splitPieces.length - 1].replace('>>', '');

    if (fields.liquidity && fields.liquidity !== '0') {
      formatter.merge(balances, coin, fields.liquidity);
    }
    if (fields.reserved_amount && fields.reserved_amount !== '0') {
      formatter.merge(balances, coin, fields.reserved_amount);
    }
  });

  usdzDepositVaults.forEach((vault: any) => {
    const {
      type,
      fields: {
        value: { fields },
      },
    } = vault;
    const splitPieces = type.split('<');
    const coin = splitPieces[splitPieces.length - 1].replace('>>', '');

    if (fields.liquidity && fields.liquidity !== '0') {
      formatter.merge(balances, coin, fields.liquidity);
    }
    if (fields.reserved_amount && fields.reserved_amount !== '0') {
      formatter.merge(balances, coin, fields.reserved_amount);
    }
  });

  zbtcvcDepositVaults.forEach((vault: any) => {
    const {
      type,
      fields: {
        value: { fields },
      },
    } = vault;
    const splitPieces = type.split('<');
    const coin = splitPieces[splitPieces.length - 1].replace('>>', '');

    if (fields.liquidity && fields.liquidity !== '0') {
      formatter.merge(balances, coin, fields.liquidity);
    }
    if (fields.reserved_amount && fields.reserved_amount !== '0') {
      formatter.merge(balances, coin, fields.reserved_amount);
    }
  });

  return balances;
}

async function getSudoBalances(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  const slpDepositVaultFields = await web3.getDynamicFieldObjects({
    parent: SLP_LIQUIDITY_POOL_VAULT,
  });

  const slpDepositVaultIds = slpDepositVaultFields.map(
    (item: any) => item.id.id,
  );

  const slpDepositVaults = await web3.getObjects(slpDepositVaultIds);

  slpDepositVaults.forEach((vault: any) => {
    const {
      type,
      fields: {
        value: { fields },
      },
    } = vault;
    const splitPieces = type.split('<');
    const coin = splitPieces[splitPieces.length - 1].replace('>>', '');

    if (fields.liquidity && fields.liquidity !== '0') {
      formatter.merge(balances, coin, fields.liquidity);
    }
    if (fields.reserved_amount && fields.reserved_amount !== '0') {
      formatter.merge(balances, coin, fields.reserved_amount);
    }
  });

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const perpsBalances = await getPerpsBalances(web3);
    balances = formatter.sum([balances, perpsBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching Zo perps balances',
      endpoint: 'getPerpsBalances',
    });
  }

  try {
    const sudoBalances = await getSudoBalances(web3);
    balances = formatter.sum([balances, sudoBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching Zo sudo balances',
      endpoint: 'getSudoBalances',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
