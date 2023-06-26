import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { hethers } from '@hashgraph/hethers';

const START_BLOCK = 1675123200;

const TOKEN_ENDPOINT =
  'https://heliswap-api.ey.r.appspot.com/tokens/whitelisted/';
const HELISWAP_ENDPOINT = 'https://heliswap-prod-362307.oa.r.appspot.com/query';

const query = `
  query getWhitelistedPools($tokens: [String]!) {
    poolsConsistingOf(tokens: $tokens) {
       token0
       token1
       token0Amount
       token1Amount
       tvl
    }
  }`;
const converToken = {
  '0.0.1055477': {
    sourceDecimal: 8,
    targetDecimal: 6,
    targetAddress: '0.0.456858',
  },
  '0.0.1055483': {
    sourceDecimal: 8,
    targetDecimal: 0,
    targetAddress: 'coingecko_btc',
  },
  '0.0.541564': {
    sourceDecimal: 8,
    targetDecimal: 0,
    targetAddress: 'coingecko_weth',
  },
  '0.0.540318': {
    sourceDecimal: 8,
    targetDecimal: 0,
    targetAddress: 'coingecko_wmatic',
  },
  '0.0.2967328': {
    sourceDecimal: 8,
    targetDecimal: 0,
    targetAddress: 'coingecko_pepe',
  },
  '0.0.2934819': {
    sourceDecimal: 8,
    targetDecimal: 0,
    targetAddress: 'coingecko_hedera',
  },
};

async function getWhitelistedTokenAddresses() {
  const response = await axios(TOKEN_ENDPOINT);
  const { data: whitelistedTokens } = response;

  return whitelistedTokens;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }
  const balances = {};

  const whitelistedAddresses = await getWhitelistedTokenAddresses();
  const requestData = {
    query,
    variables: {
      tokens: whitelistedAddresses,
    },
  };

  const {
    data: {
      data: { poolsConsistingOf },
    },
  } = await axios({
    url: HELISWAP_ENDPOINT,
    method: 'post',
    data: requestData,
  });

  poolsConsistingOf.forEach((pool) => {
    if (balances[hethers.utils.asAccountString(pool.token0)]) {
      balances[hethers.utils.asAccountString(pool.token0)] = BigNumber(
        balances[hethers.utils.asAccountString(pool.token0)],
      ).plus(pool.token0Amount);
    } else {
      balances[hethers.utils.asAccountString(pool.token0)] = pool.token0Amount;
    }
    if (balances[hethers.utils.asAccountString(pool.token1)]) {
      balances[hethers.utils.asAccountString(pool.token1)] = BigNumber(
        balances[hethers.utils.asAccountString(pool.token1)],
      ).plus(pool.token1Amount);
    } else {
      balances[hethers.utils.asAccountString(pool.token1)] = pool.token1Amount;
    }
  });
  formatter.swapTokenAddresses(balances, converToken);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
