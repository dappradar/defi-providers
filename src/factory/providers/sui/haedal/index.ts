import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';
import BigNumber from 'bignumber.js';
import axios from 'axios';
import basicUtil from '../../../../util/basicUtil';
import suiTokens from '../../../../constants/tokens/sui.json';

const SUI_STAKING_OBJECT_ID =
  '0x47b224762220393057ebf4f70501b6e657c3e56684737568439a04f80849b2ca';
const WAL_STAKING_OBJECT_ID =
  '0x9e5f6537be1a5b658ec7eed23160df0b28c799563f6c41e9becc9ad633cb592b';

const PACKAGE_ID =
  '0x8462eb7e1c52018f42f2dd2c33605f7212ad8702739a5eaacb0e1a0106f3dc6a';
const HAEDAL_VAULTS_API =
  'https://haedal.xyz/api/v3/sui/vaults/pools?category=haedal&order_by=tvl&id=&coin_type=';

const DUMMY_SENDER =
  '0x0000000000000000000000000000000000000000000000000000000000000000';
const HAEDAL_AMM_POOLS_ID =
  '0x3b822ea230e2f63860b05d4166ddce7133c0d04838d8f93ce02a88098fe0c609';

async function getBalances(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  const suiStakingObject = await web3.getObject(SUI_STAKING_OBJECT_ID);
  const walStakingObject = await web3.getObject(WAL_STAKING_OBJECT_ID);

  const suiAmount = new BigNumber(suiStakingObject.total_staked || 0)
    .plus(new BigNumber(suiStakingObject.total_rewards || 0))
    .minus(new BigNumber(suiStakingObject.total_protocol_fees || 0))
    .minus(new BigNumber(suiStakingObject.uncollected_protocol_fees || 0))
    .minus(new BigNumber(suiStakingObject.total_unstaked || 0))
    .plus(new BigNumber(suiStakingObject.unclaimed_sui_amount || 0));

  const walAmount = new BigNumber(walStakingObject.total_staked || 0)
    .plus(new BigNumber(walStakingObject.total_rewards || 0))
    .minus(new BigNumber(walStakingObject.collected_protocol_fees || 0))
    .minus(new BigNumber(walStakingObject.uncollected_protocol_fees || 0))
    .minus(new BigNumber(walStakingObject.total_unstaked || 0))
    .plus(new BigNumber(walStakingObject.unclaimed_wal_amount || 0));

  if (suiAmount.isGreaterThan(0)) {
    formatter.merge(balances, suiTokens.SUI, suiAmount.toFixed(0));
  }

  if (walAmount.isGreaterThan(0)) {
    formatter.merge(balances, suiTokens.WAL, walAmount.toFixed(0));
  }

  return balances;
}

// Helper functions for transaction building
function hexToBytes(hex: string): number[] {
  return Array.from(Buffer.from(hex.replace(/^0x/, ''), 'hex'));
}

function textToBytes(value: string): number[] {
  return Array.from(new TextEncoder().encode(value));
}

function toU64(value: number | bigint): number[] {
  return Array.from(toLittleEndian(BigInt(value), 8));
}

function toLittleEndian(bigint: bigint, size: number): Uint8Array {
  const result = new Uint8Array(size);
  let i = 0;
  while (bigint > 0) {
    result[i] = Number(bigint % BigInt(256));
    bigint = bigint / BigInt(256);
    i += 1;
  }
  return result;
}

function desU64(data: number[], offset = 0): bigint {
  const dataView = new DataView(Uint8Array.from(data).buffer);
  const value1 = dataView.getUint32(offset, true);
  const value2 = dataView.getUint32(offset + 4, true);
  return (BigInt(value2) << BigInt(32)) | BigInt(value1);
}

function parseSuiAddress(str: string) {
  const STRUCT_REGEX = /^([^:]+)::([^:]+)::([^<]+)(<(.+)>)?/;
  const structMatch = str.match(STRUCT_REGEX);
  if (structMatch) {
    return {
      address: structMatch[1],
      module: structMatch[2],
      name: structMatch[3],
      typeParams: [],
    };
  }
  throw new Error(
    `Encountered unexpected token when parsing type args for ${str}`,
  );
}

function buildGetVaultAssetsTxBytes(
  packageId: string,
  typeParams: string[],
  vaultId: string,
  poolId: string,
  vaultInitialVersion: number,
  poolInitialVersion: number,
): Uint8Array {
  const ProgrammableTransactionIndex = 0;
  const ObjectIndex = 1;
  const SharedObjectIndex = 1;
  const MoveCallIndex = 0;
  const StructIndex = 7;
  const InputIndex = 1;

  const moduleArg = textToBytes('pool');
  const functionArg = textToBytes('get_vault_assets');

  const typeArgs = typeParams.map((t) => {
    const parsed = parseSuiAddress(t);
    return {
      address: parsed.address,
      module: parsed.module,
      name: parsed.name,
      typeParams: parsed.typeParams || [],
    };
  });

  let bytes = [ProgrammableTransactionIndex, 2];

  // First input (vault)
  bytes = bytes.concat([
    ObjectIndex,
    SharedObjectIndex,
    ...hexToBytes(vaultId),
    ...toU64(vaultInitialVersion),
    1, // mutable
  ]);

  // Second input (pool)
  bytes = bytes.concat([
    ObjectIndex,
    SharedObjectIndex,
    ...hexToBytes(poolId),
    ...toU64(poolInitialVersion),
    1, // mutable
  ]);

  // Commands
  bytes = bytes.concat([
    1,
    MoveCallIndex,
    ...hexToBytes(packageId),
    moduleArg.length,
    ...moduleArg,
    functionArg.length,
    ...functionArg,
  ]);

  // Type arguments
  bytes = bytes.concat([typeArgs.length]);

  for (const typeArg of typeArgs) {
    const typeModule = textToBytes(typeArg.module);
    const typeName = textToBytes(typeArg.name);

    bytes = bytes.concat([
      StructIndex,
      ...hexToBytes(typeArg.address),
      typeModule.length,
      ...typeModule,
      typeName.length,
      ...typeName,
      typeArg.typeParams.length,
    ]);
  }

  // Arguments
  bytes = bytes.concat([2, InputIndex, 0, 0, InputIndex, 1, 0]);

  return Uint8Array.from(bytes);
}

async function getVaultTokenBalance(
  web3: any,
  packageId: string,
  typeParams: string[],
  vaultId: string,
  poolId: string,
  vaultInitialVersion: number,
  poolInitialVersion: number,
): Promise<[string, string]> {
  const txBlockBytes = buildGetVaultAssetsTxBytes(
    packageId,
    typeParams,
    vaultId,
    poolId,
    vaultInitialVersion,
    poolInitialVersion,
  );

  const inspectionResult = await web3.devInspectTransactionBlock(
    DUMMY_SENDER,
    Buffer.from(txBlockBytes).toString('base64'),
  );

  if (inspectionResult?.effects?.status?.status !== 'success') {
    throw new Error(JSON.stringify(inspectionResult, null, 2));
  }

  const returnValues = inspectionResult.results[0].returnValues;

  if (!returnValues || returnValues.length < 2) {
    throw new Error('Invalid return values structure');
  }

  const coinAData = returnValues[0][0];
  const coinBData = returnValues[1][0];

  if (!coinAData || coinAData.length !== 8) {
    throw new Error(
      `Invalid coinA data: length ${coinAData?.length}, expected 8`,
    );
  }
  if (!coinBData || coinBData.length !== 8) {
    throw new Error(
      `Invalid coinB data: length ${coinBData?.length}, expected 8`,
    );
  }

  let coinA, coinB;
  try {
    coinA = desU64(Array.from(Uint8Array.from(coinAData))).toString();
  } catch (error) {
    throw new Error(`Failed to parse coinA: ${error.message}`);
  }

  try {
    coinB = desU64(Array.from(Uint8Array.from(coinBData))).toString();
  } catch (error) {
    throw new Error(`Failed to parse coinB: ${error.message}`);
  }

  return [coinA, coinB];
}

async function vaultBalances(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  let vaultsData;
  try {
    const response = await axios.get(HAEDAL_VAULTS_API);
    vaultsData = response.data?.data?.list;
    await basicUtil.saveIntoCache(
      vaultsData,
      'vaultBalancesData.json',
      'sui',
      'haedal',
    );
  } catch (e) {
    log.error({
      message: `Issue with Haedal API`,
      stack: e.stack,
      detail: `Error: vaultBalances of sui/haedal`,
      endpoint: 'vaultBalances',
    });
    vaultsData = await basicUtil.readFromCache(
      'vaultBalancesData.json',
      'sui',
      'haedal',
    );
  }

  if (!vaultsData || !Array.isArray(vaultsData)) {
    return balances;
  }

  for (const vault of vaultsData) {
    try {
      const { coin_type_a, coin_type_b, lp_type, id, clmm_pool } = vault;

      if (!coin_type_a || !coin_type_b || !lp_type || !id || !clmm_pool) {
        continue;
      }

      let vaultObjectData;
      try {
        vaultObjectData = await web3.getFullObject(id);
      } catch (error) {
        continue;
      }

      let poolObjectData;
      try {
        poolObjectData = await web3.getFullObject(clmm_pool);
      } catch (error) {
        continue;
      }

      const vaultInitialVersion =
        vaultObjectData.owner.Shared.initial_shared_version;
      const poolInitialVersion =
        poolObjectData.owner.Shared.initial_shared_version;

      const [coinA, coinB] = await getVaultTokenBalance(
        web3,
        PACKAGE_ID,
        [lp_type, coin_type_a, coin_type_b],
        id,
        clmm_pool,
        vaultInitialVersion,
        poolInitialVersion,
      );

      if (coinA && coinA !== '0') {
        formatter.merge(balances, coin_type_a, coinA);
      }
      if (coinB && coinB !== '0') {
        formatter.merge(balances, coin_type_b, coinB);
      }
    } catch (error) {
      continue;
    }
  }

  return balances;
}

async function getAmmBalances(web3: any): Promise<{ [key: string]: string }> {
  const poolObject = await web3.getObject(HAEDAL_AMM_POOLS_ID);
  const listPool = poolObject.pools.fields.contents;
  const balances: { [key: string]: string } = {};

  for (const pool of listPool) {
    const poolId = pool.fields.value;
    const poolData = await web3.getObject(poolId);

    const poolType = poolData.coins.type;
    const baseCoin = poolData.coins.fields.base_coin;
    const quoteCoin = poolData.coins.fields.quote_coin;

    const [coinA, coinB] = poolType.replace('>', '').split('<')[1].split(', ');

    if (!balances[coinA]) balances[coinA] = '0';
    if (!balances[coinB]) balances[coinB] = '0';

    balances[coinA] = (BigInt(balances[coinA]) + BigInt(baseCoin)).toString();
    balances[coinB] = (BigInt(balances[coinB]) + BigInt(quoteCoin)).toString();
  }

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const haedalBalances = await getBalances(web3);
    balances = formatter.sum([balances, haedalBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: `Error: getBalances`,
      endpoint: 'getBalances',
    });
  }

  try {
    const vaultBalancesData = await vaultBalances(web3);
    balances = formatter.sum([balances, vaultBalancesData]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: `Error: vaultBalances`,
      endpoint: 'vaultBalances',
    });
  }

  try {
    const ammBalancesData = await getAmmBalances(web3);
    balances = formatter.sum([balances, ammBalancesData]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: `Error: getAmmBalances`,
      endpoint: 'getAmmBalances',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
