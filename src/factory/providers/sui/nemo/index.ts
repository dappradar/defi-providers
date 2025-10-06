import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';
import BigNumber from 'bignumber.js';

const VAULT_LIST = [
  '0x18fe46d697a3ce2c87b62db5435678ff8df179efc913e250e888019d2f1c4105',
  '0x1c29c232ff5a34eb8edf9b3dd593890cd2c537d7a57e30c6730391271de0b5e6',
  '0x9356a36b0066561f66db7681d87537c8d9a992ca8e12095be91dcea500211015',
  '0x5ca7c661f9e454bbcd780f4d376ccbf536ec34402d99a840bdfb595021e9d727',
];

function convertToSignedInt(value: any, bits = 32) {
  return Number(BigInt.asIntN(bits, BigInt(value)));
}

function calculateTickToSqrtPrice(tick: number) {
  return Math.pow(1.0001, tick / 2);
}

function calculatePriceFromSqrt(
  sqrtPrice: any,
  decimalsA: any,
  decimalsB: any,
) {
  const price = new BigNumber(sqrtPrice).pow(2);
  return price.times(Math.pow(10, decimalsB - decimalsA));
}

async function computeVaultValue(vault: any): Promise<string> {
  try {
    const clmmPoolId = vault.fields.clmm_pool_id;
    const pool = await vault.web3.getObject(clmmPoolId);

    const position = await vault.web3.getDynamicFieldObject(
      vault.fields.id.id,
      [112, 111, 115, 105, 116, 105, 111, 110],
      { idType: 'vector<u8>' },
    );

    const sqrtPrice = pool.sqrt_price;
    const liquidity = position.value.fields.liquidity;
    const lowerBits = position.value.fields.tick_lower_index.fields.bits;
    const upperBits = position.value.fields.tick_upper_index.fields.bits;
    const decimalsA = vault.fields.decimals_a;
    const decimalsB = vault.fields.decimals_b;

    if (
      !sqrtPrice ||
      !liquidity ||
      lowerBits === undefined ||
      upperBits === undefined
    ) {
      return '0';
    }

    const lowerSqrtPrice = calculateTickToSqrtPrice(
      convertToSignedInt(BigInt(lowerBits)),
    );
    const upperSqrtPrice = calculateTickToSqrtPrice(
      convertToSignedInt(BigInt(upperBits)),
    );

    const liq = new BigNumber(liquidity.toString());
    const curSqrtPrice = new BigNumber(sqrtPrice.toString());
    const lowerPrice = new BigNumber(lowerSqrtPrice.toString());
    const upperPrice = new BigNumber(upperSqrtPrice.toString());

    let coinA: BigNumber;
    let coinB: BigNumber;

    if (curSqrtPrice.lt(lowerPrice)) {
      coinA = liq
        .times(upperPrice.minus(lowerPrice))
        .div(lowerPrice.times(upperPrice));
      coinB = new BigNumber(0);
    } else if (curSqrtPrice.lt(upperPrice)) {
      coinA = liq
        .times(upperPrice.minus(curSqrtPrice))
        .div(curSqrtPrice.times(upperPrice));
      coinB = liq.times(curSqrtPrice.minus(lowerPrice));
    } else {
      coinA = new BigNumber(0);
      coinB = liq.times(upperPrice.minus(lowerPrice));
    }

    const priceMultiplier = calculatePriceFromSqrt(
      sqrtPrice,
      decimalsA,
      decimalsB,
    );
    const result = coinA.times(priceMultiplier).plus(coinB).toFixed(0);
    return result;
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error computing vault value',
      endpoint: 'computeVaultValue',
    });
    return '0';
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};

  try {
    const vaults = await web3.getObjects(VAULT_LIST);

    for (const vault of vaults) {
      if (!vault) continue;

      vault.web3 = web3;
      const vaultTypes = vault.type.replace('>', '').split('<')[1].split(', ');
      const vaultValue = await computeVaultValue(vault);

      if (vaultTypes[1] && vaultValue && vaultValue !== '0') {
        formatter.merge(balances, vaultTypes[1], vaultValue);
      }
    }
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching Nemo TVL',
      endpoint: 'tvl',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
