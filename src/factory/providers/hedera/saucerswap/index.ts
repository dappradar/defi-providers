/*==================================================
  Modules
  ==================================================*/

import chainWeb3 from '../../../sdk/web3SDK/chainWeb3';
import util from '../../../sdk/util';
import basicUtil from '../../../sdk/helpers/basicUtil';

/*=================================================
  Settings
  ==================================================*/

const FACTORY_ADDRESS = '0.0.1062784';
const WRAPPED_TOKENS = {
  '0.0.1062664': {
    token: 'hbar',
    decimalOffset: 0,
  },
  '0.0.1055483': {
    token: 'coingecko_bitcoin',
    decimalOffset: 8,
  },
  '0.0.1055459': {
    token: 'coingecko_usd-coin',
    decimalOffset: 6,
  },
  '0.0.1055495': {
    token: 'coingecko_chainlink',
    decimalOffset: 8,
  },
  '0.0.1055477': {
    token: 'coingecko_dai',
    decimalOffset: 8,
  },
  '0.0.1055472': {
    token: 'coingecko_tether',
    decimalOffset: 6,
  },
};

/*==================================================
  TVL
  ==================================================*/

async function tvl(params) {
  const { block, chain, provider } = params;
  if (block < 1658191103) {
    return {};
  }

  const web3 = chainWeb3.getWeb3(chain);

  let pools = {};
  try {
    pools = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  const lpTokens = (await web3.eth.getBalances(FACTORY_ADDRESS, block)).map(
    (data) => data.token,
  );

  lpTokens.forEach((token) => {
    const splits = token.split('.');
    splits[splits.length - 1] = Number(splits[splits.length - 1]) - 1;
    const poolAddress = splits.join('.');
    pools[poolAddress] = {};
  });

  basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  const poolBalances = await Promise.all(
    Object.keys(pools).map((address) => web3.eth.getBalances(address, block)),
  );

  const balances = {};

  poolBalances.forEach((poolBalance) => {
    const wrappedBalances = poolBalance.map((data) => {
      if (WRAPPED_TOKENS[data.token]) {
        return {
          token: WRAPPED_TOKENS[data.token].token,
          balance: data.balance.div(
            10 ** WRAPPED_TOKENS[data.token].decimalOffset,
          ),
        };
      }
      return data;
    });
    util.sumMultiBalanceOf(balances, wrappedBalances);
  });

  util.convertBalancesToFixed(balances);

  return { balances };
}

/*==================================================
  Exports
  ==================================================*/

export { tvl };
