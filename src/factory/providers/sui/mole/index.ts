import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';
import axios from 'axios';
import basicUtil from '../../../../util/basicUtil';

async function getProtocolAddresses(): Promise<any> {
  let addressesData;
  try {
    const response = await axios.get(
      'https://raw.githubusercontent.com/Mole-Fi/mole-protocol/main/.sui_mainnet.json',
    );
    addressesData = response.data;
    await basicUtil.saveIntoCache(
      addressesData,
      'moleAddresses.json',
      'sui',
      'mole',
    );
  } catch (e) {
    log.error({
      message: `Issue with Mole protocol addresses API`,
      stack: e.stack,
      detail: `Error: getProtocolAddresses fetch`,
      endpoint: 'getProtocolAddresses',
    });
    addressesData = await basicUtil.readFromCache(
      'moleAddresses.json',
      'sui',
      'mole',
    );
  }

  return addressesData;
}

function i32BitsToNumber(bits: number): number {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setUint32(0, bits, true);
  return view.getInt32(0, true);
}

async function getMoleTvl(web3: any): Promise<{ [key: string]: string }> {
  const balances = {};

  const addresses = await getProtocolAddresses();
  if (!addresses) return balances;

  const workerInfoIds = addresses.Vaults.flatMap(
    (vault: any) => vault.workers,
  ).map((worker: any) => worker.workerInfo);

  const workerInfos = await web3.getObjects(workerInfoIds);

  const workerEntities = addresses.Vaults.flatMap(
    (vault: any) => vault.workers,
  );

  const poolIdSet = new Set(
    workerInfos
      .map((workerInfo: any) => {
        const workerId = workerInfo?.fields?.id?.id;
        const entity = workerEntities.find(
          ({ workerInfo: w }: any) => w === workerId,
        );
        if (!entity) return null;

        return entity.isSF
          ? workerInfo.fields.clmm_pool_id
          : workerInfo.fields.position_nft?.fields?.pool;
      })
      .filter(Boolean),
  );

  const poolIds = Array.from(poolIdSet);
  const poolInfos = await web3.getObjects(poolIds);

  const poolMap = new Map(
    poolInfos.map((poolInfo: any) => [poolInfo.fields.id.id, poolInfo]),
  );

  for (const workerInfo of workerInfos) {
    const workerId = workerInfo?.fields?.id?.id;
    const workerEntity = workerEntities.find(
      ({ workerInfo: w }: any) => w === workerId,
    );
    if (!workerEntity) continue;

    const isSF = workerEntity.isSF;
    const nftFields = isSF
      ? workerInfo.fields.stable_farming_position_nft?.fields?.clmm_postion
          ?.fields
      : workerInfo.fields.position_nft?.fields;

    if (!nftFields) continue;

    const liquidity = nftFields.liquidity;
    const tickLower = i32BitsToNumber(nftFields.tick_lower_index?.fields?.bits);
    const tickUpper = i32BitsToNumber(nftFields.tick_upper_index?.fields?.bits);
    const poolId = isSF ? workerInfo.fields.clmm_pool_id : nftFields.pool;

    const poolInfo = poolMap.get(poolId);
    if (!poolInfo) continue;

    const currentSqrtPrice = (poolInfo as any).fields.current_sqrt_price;
    const tick = Math.floor(
      Math.log((currentSqrtPrice / 2 ** 64) ** 2) / Math.log(1.0001),
    );

    const poolType = (poolInfo as any).type?.replace('>', '');
    const tokens = poolType?.split('<')[1]?.split(', ');
    if (!tokens || tokens.length !== 2) continue;

    const [token0, token1] = tokens;

    web3.addUniV3LikePosition(
      balances,
      token0,
      token1,
      liquidity,
      tickLower,
      tickUpper,
      tick,
    );
  }

  const vaultInfoIds = addresses.Vaults.map((vault: any) => vault.vaultInfo);
  const vaultInfos = await web3.getObjects(vaultInfoIds);

  for (let i = 0; i < vaultInfos.length; i++) {
    const baseToken = addresses.Vaults[i].baseToken;
    const tokenAmount = vaultInfos[i].fields.value.fields.coin;
    const vaultDebtVal = vaultInfos[i].fields.value.fields.vault_debt_val;
    const vaultAmount = parseInt(tokenAmount) + parseInt(vaultDebtVal);
    formatter.merge(balances, baseToken, vaultAmount.toString());
  }

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const moleBalances = await getMoleTvl(web3);
    balances = formatter.sum([balances, moleBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching Mole TVL',
      endpoint: 'tvl',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
