import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import fetch from 'node-fetch';
import basicUtil from '../../../../util/basicUtil';

const MOVE_DOLLAR_ADDRESS =
  '0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01';
const THALASWAP_ADDRESS =
  '0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af';
const LSD_ACCOUNT =
  '0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6';
const THALA_VALIDATOR =
  '0xe888a0adfb4ca871bfe6aada8511f5326e877a8ce66a9980ef089eb2218d740c';
const THALASWAP_LENS_ADDRESS =
  '0xff1ac437457a839f7d07212d789b85dd77b3df00f59613fcba02388464bfcacb';

const extractCoinAddress = (resource: any) =>
  resource.type.split('<')[1].replace('>', '').split(', ');
const nullCoinType = 'base_pool::Null';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const balances = {};

  try {
    const moveDollarTvl = await getMoveDollarTvl(params);
    const thalaswapV1Tvl = await getThalaswapV1Tvl(params);
    const thalaLsdTvl = await getThalaLsdTvl(params);
    const thalaswapV2Tvl = await getThalaswapV2Tvl(params);
    [moveDollarTvl, thalaswapV1Tvl, thalaLsdTvl, thalaswapV2Tvl].forEach(
      (result) => {
        Object.entries(result.balances || {}).forEach(([address, balance]) => {
          formatter.merge(balances, address, balance);
        });
      },
    );
  } catch (error) {
    console.log('Error fetching Thala data:', error);
  }

  formatter.mapAptosTokenAddresses(balances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

// Move Dollar CDP - Vaults and PSMs
async function getMoveDollarTvl(
  params: ITvlParams,
): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};

  try {
    const resources = await web3.eth.getResources(MOVE_DOLLAR_ADDRESS);

    const vaults = resources
      .filter((resource) =>
        resource.type.includes(`${MOVE_DOLLAR_ADDRESS}::vault::Vaults<`),
      )
      .map((vault) => ({
        total_collateral: vault.data.total_collateral,
        asset_type: extractCoinAddress(vault),
      }));

    const psms = resources
      .filter((resource) =>
        resource.type.includes(`${MOVE_DOLLAR_ADDRESS}::psm::PSM<`),
      )
      .map((psm) => ({
        total_collateral: psm.data.coin.value,
        asset_type: extractCoinAddress(psm),
      }));

    vaults.forEach(({ asset_type, total_collateral }) => {
      if (asset_type[0] && total_collateral !== '0') {
        formatter.merge(balances, asset_type[0], total_collateral);
      }
    });

    psms.forEach(({ asset_type, total_collateral }) => {
      if (asset_type[0] && total_collateral !== '0') {
        formatter.merge(balances, asset_type[0], total_collateral);
      }
    });
  } catch (error) {
    console.log('Error fetching Move Dollar data:', error);
  }

  return { balances };
}

// Thalaswap V1 - Stable and Weighted pools
async function getThalaswapV1Tvl(
  params: ITvlParams,
): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};

  try {
    const resources = await web3.eth.getResources(THALASWAP_ADDRESS);

    const pools = resources
      .filter(
        (resource) =>
          resource.type.includes(
            `${THALASWAP_ADDRESS}::stable_pool::StablePool<`,
          ) ||
          resource.type.includes(
            `${THALASWAP_ADDRESS}::weighted_pool::WeightedPool<`,
          ),
      )
      .map((pool) => ({
        assets: [
          pool.data.asset_0,
          pool.data.asset_1,
          pool.data.asset_2,
          pool.data.asset_3,
        ],
        asset_types: extractCoinAddress(pool),
      }));

    pools.forEach(({ assets, asset_types }) => {
      assets.forEach((asset, index) => {
        if (
          asset_types[index] &&
          !asset_types[index].includes(nullCoinType) &&
          asset.value !== '0'
        ) {
          formatter.merge(balances, asset_types[index], asset.value);
        }
      });
    });
  } catch (error) {
    console.log('Error fetching Thalaswap V1 data:', error);
  }

  return { balances };
}

// Thala LSD - Liquid staking derivatives
async function getThalaLsdTvl(
  params: ITvlParams,
): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};

  try {
    const supplyResponse = await web3.eth.query(
      `/accounts/${LSD_ACCOUNT}/resource/0x1::coin::CoinInfo%3C${LSD_ACCOUNT}::staking::ThalaAPT%3E`,
    );

    const supply = supplyResponse.data?.data?.supply;
    if (!supply?.vec?.[0]?.integer?.vec?.[0]?.value) {
      return { balances };
    }

    const validatorStake = await web3.eth.functionView({
      functionStr: '0x1::delegation_pool::get_delegation_pool_stake',
      type_arguments: [],
      args: [THALA_VALIDATOR],
    });

    const thaptSupply = Number(supply.vec[0].integer.vec[0].value);
    const [active, inactive, pending_active, pending_inactive] = validatorStake;
    const validatorApt =
      Number(active) +
      Number(inactive) +
      Number(pending_active) +
      Number(pending_inactive);

    const totalApt = (thaptSupply + validatorApt) / 1e8;

    if (totalApt > 0) {
      formatter.merge(
        balances,
        '0x1::aptos_coin::aptoscoin',
        Math.floor(totalApt * 1e8).toString(),
      );
    }
  } catch (error) {
    console.log('Error fetching Thala LSD data:', error);
  }

  return { balances };
}

// Thalaswap V2 - New AMM pools
async function getThalaswapV2Tvl(
  params: ITvlParams,
): Promise<Partial<ITvlReturn>> {
  const { web3, chain, provider } = params;
  const balances = {};

  try {
    let poolsData = [];

    try {
      const response = await fetch('https://app.thala.fi/api/liquidity-pools');
      const apiData = await response.json();

      if (apiData.data && Array.isArray(apiData.data)) {
        poolsData = apiData.data.filter((pool) => pool.metadata.isV2);

        const cache = { pools: poolsData };
        await basicUtil.saveIntoCache(
          cache,
          'thalaswap-v2-pools.json',
          chain,
          provider,
        );
      }
    } catch (error) {
      try {
        const cache = await basicUtil.readFromCache(
          'thalaswap-v2-pools.json',
          chain,
          provider,
        );

        if (cache.pools && Array.isArray(cache.pools)) {
          poolsData = cache.pools;
        }
      } catch (cacheError) {}
    }

    const errors = [];

    for (const pool of poolsData) {
      try {
        const poolInfo = await web3.eth.functionView({
          functionStr: `${THALASWAP_LENS_ADDRESS}::lens::get_pool_info`,
          type_arguments: [],
          args: [pool.metadata.lptAddress],
        });

        const poolData = poolInfo[0];
        const assets = poolData.assets_metadata.map((asset) => asset.inner);
        const balances_data = poolData.balances;

        assets.forEach((asset, index) => {
          if (asset && balances_data[index] && balances_data[index] !== '0') {
            formatter.merge(balances, asset, balances_data[index]);
          }
        });
      } catch (poolError) {
        errors.push(poolError);
      }
    }

    if (errors.length > 0) {
      throw errors[0];
    }
  } catch (error) {
    throw error;
  }

  return { balances };
}

export { tvl };
