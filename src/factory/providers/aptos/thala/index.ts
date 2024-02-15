import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';
const TAHA_SWAP =
  '0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af';
const MOVE_DOLLAR =
  '0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01';
const LSD_ACCOUNT =
  '0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6';

function sum(balances, result) {
  Object.entries(result).forEach(([address, balance]) => {
    if (!balances[address]) {
      balances[address] = balance;
    } else balances[address] = balances[address].plus(balance);
  });
}
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const balances = {};
  const swap = await thalaSwap(params);
  const cdp = await thalaCDP(params);
  const lsd = await thalaLSD(params);

  sum(balances, swap.balances);
  sum(balances, cdp.balances);
  sum(balances, lsd.balances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

async function thalaSwap(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;

  const balances = {};
  const resources = await web3.eth.getResources(TAHA_SWAP);

  const pools = resources
    .filter(
      (resource) =>
        resource.type.includes(`${TAHA_SWAP}::stable_pool::StablePool<`) ||
        resource.type.includes(`${TAHA_SWAP}::weighted_pool::WeightedPool<`),
    )
    .map((pool) => ({
      assets: [
        pool.data.asset_0,
        pool.data.asset_1,
        pool.data.asset_2,
        pool.data.asset_3,
      ],
      asset_types: pool.type.split('<')[1].replace('>', '').split(', '),
    }));

  pools.forEach(({ assets, asset_types }) => {
    assets.forEach((asset, index) => {
      if (!asset_types[index]?.includes('base_pool::Null'))
        formatter.merge(balances, asset_types[index], asset.value);
    });
  });

  return { balances };
}

async function thalaCDP(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;

  const balances = {};
  const resources = await web3.eth.getResources(MOVE_DOLLAR);
  const vaults = resources
    .filter((resource) =>
      resource.type.includes(`${MOVE_DOLLAR}::vault::Vaults<`),
    )
    .map((vault) => ({
      total_collateral: vault.data.total_collateral,
      asset_type: vault.type.split('<')[1].replace('>', '').split(', '),
    }));

  const psms = resources
    .filter((resource) => resource.type.includes(`${MOVE_DOLLAR}::psm::PSM<`))
    .map((psm) => ({
      total_collateral: psm.data.coin.value,
      asset_type: psm.type.split('<')[1].replace('>', '').split(', '),
    }));

  vaults.forEach(({ asset_type, total_collateral }) => {
    formatter.merge(balances, asset_type[0], total_collateral);
  });
  psms.forEach(({ asset_type, total_collateral }) => {
    formatter.merge(balances, asset_type[0], total_collateral);
  });

  return { balances };
}

async function thalaLSD(
  params: ITvlParams,
): Promise<{ balances: { '0x1::aptos_coin::aptoscoin': BigNumber } }> {
  const { web3 } = params;

  const {
    data: { supply },
  } = (
    await web3.eth.query(
      `/accounts/${LSD_ACCOUNT}/resource/0x1::coin::CoinInfo%3C${LSD_ACCOUNT}::staking::ThalaAPT%3E`,
    )
  ).data;

  return {
    balances: {
      '0x1::aptos_coin::aptoscoin': new BigNumber(
        supply.vec[0].integer.vec[0].value / 1e8,
      ),
    },
  };
}
export { tvl };
