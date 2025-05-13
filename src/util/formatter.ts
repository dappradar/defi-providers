import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import _ from 'underscore';
import { log } from './logger/logger';

function encodeParameters(types, values) {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, Array.isArray(values) ? values : [values]);
}

function decodeParameters(types, data) {
  if (!data || data == '0x') {
    return null;
  }
  const abi = new ethers.utils.AbiCoder();
  return abi.decode(types, data);
}

function decodeResult(method_abi, result) {
  const method_output_params = method_abi.outputs;
  const decoded_result = decodeParameters(method_output_params, result);
  if (decoded_result && decoded_result.length == 1) {
    if (Array.isArray(decoded_result[0])) {
      return decoded_result[0].map((result) => result.toString());
    }
    return decoded_result[0].toString();
  } else {
    if (!decoded_result && method_output_params.length == 1) {
      return null;
    }
    const tuple = {};
    method_output_params.forEach((output, index) => {
      tuple[index] = decoded_result ? decoded_result[index].toString() : null;
      tuple[output.name] = decoded_result
        ? decoded_result[index].toString()
        : null;
    });
    return tuple;
  }
}

function convertBalancesToFixed(balances) {
  for (const token in balances) {
    try {
      balances[token] = balances[token].toFixed();
    } catch {}
  }
  return balances;
}

function convertBalancesToBigNumber(balances) {
  for (const token in balances) {
    balances[token] = new BigNumber(balances[token]);
  }
  return balances;
}

function sum(balanceArray) {
  const balances = {};

  _.each(balanceArray, (balanceEntries) => {
    _.each(balanceEntries, (balance, address) => {
      balances[address] = BigNumber(balances[address] || 0)
        .plus(balance)
        .toFixed();
    });
  });

  return balances;
}

function merge(balances, token, reserve) {
  if (!balances[token.toLowerCase()]) {
    balances[token.toLowerCase()] = new BigNumber(reserve);
  } else
    balances[token.toLowerCase()] = balances[token.toLowerCase()].plus(reserve);
}

function sumMultiBalanceOf(balances, results, chain = '', provider = '') {
  try {
    if (results.output) {
      _.each(results.output, (result) => {
        if (result.success) {
          const address = result.input.target;
          const balance = result.output;

          if (BigNumber(balance).toNumber() <= 0) {
            return;
          }

          balances[address] = BigNumber(balances[address] || 0)
            .plus(balance)
            .toFixed();
        }
      });
      convertBalancesToFixed(balances);
    } else {
      convertBalancesToBigNumber(balances);
      results.forEach((result) => {
        if (result && result.balance.isGreaterThan(0)) {
          const address = result?.token?.startsWith('0x')
            ? result.token.toLowerCase()
            : result.token;

          balances[address] = BigNumber(balances[address] || 0).plus(
            result.balance,
          );
        }
      });
    }
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: sumMultiBalanceOf chain: ${chain}  provider: ${provider}`,
      endpoint: 'sumMultiBalanceOf',
    });
    return balances;
  }
}

function swapTokenAddresses(
  tokens: { [key: string]: any },
  rule: {
    [key: string]: {
      sourceDecimal: number;
      targetDecimal: number;
      targetAddress: string;
    };
  },
) {
  Object.keys(tokens).forEach((address) => {
    if (rule[address]) {
      tokens[rule[address].targetAddress] = BigNumber(
        tokens[rule[address].targetAddress] || 0,
      )
        .plus(
          BigNumber(tokens[address]).shiftedBy(
            rule[address].targetDecimal - rule[address].sourceDecimal,
          ),
        )
        .toFixed();
      delete tokens[address];
    }
  });
}

/**
 * Formats Stellar asset names by standardizing native assets and replacing separators
 * @param assetName The Stellar asset name (e.g. "native" or "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN")
 * @returns Formatted asset name (e.g. "xlm" or "usdc-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN")
 */
function formatStellarAddresses(assetName: string): string {
  const formattedName = assetName.toLowerCase();

  // Handle native asset
  if (formattedName === 'native') {
    return 'xlm';
  } else if (formattedName.startsWith('native:')) {
    return 'xlm';
  }

  // Replace ":" with "-" in non-native asset names
  return formattedName.replace(/:/g, '-');
}

/**
 * Maps specific Stellar token addresses to their corresponding tokens
 * @param balances Object with balances to be mapped
 * @returns Updated balances object
 */
function mapStellarTokenAddresses(balances) {
  const mappings = {
    'usdx-gavh5zwacay2phpug4fl3lhhjiyihofpsiugm2khk25cjwxhav6qkdmn':
      'usdc-ga5zsejyb37jrc5avcia5mop4rhtm335x2kgx3ihojapp5re34k4kzvn',
    'eurx-gavh5zwacay2phpug4fl3lhhjiyihofpsiugm2khk25cjwxhav6qkdmn':
      'eurc-gdhu6wrg4ieqxm5nz4bmpkoxhw76mzm4y2iemfdvxbsdp6sjy4itnpp2',
    'yusdc-gdgtvwsm4mgs4t7z6w4rpwoche2i6rdfcifzgs3doa63lwqtrnznttff':
      'usdc-ga5zsejyb37jrc5avcia5mop4rhtm335x2kgx3ihojapp5re34k4kzvn',
    'yeth-gdyqnef2uwtk4l6hitmt53mz6f5qwo3q4uve6scgc4omeqizqqderqfd':
      'eth-gbfxohvas43oiwnio7xlrjaht3bicfeikojlzvxnt572mism4cmgsocc',
    'ybtc-gbuvrnh4rw4vlhp4c5mof46rrirzlavhygx45mvstka2f6tmr7e7l6nw':
      'btc-gdpjali4azkuu2w426u5wkmat6cn3ajrpiiryr2ym54tl2gdwo5o2mzm',
    'susd-gchw7cwi7gmiyqyfxmfjnjx5645xgwiiniaeqk3sabqo6cayl5t7jyih':
      'usdc-ga5zsejyb37jrc5avcia5mop4rhtm335x2kgx3ihojapp5re34k4kzvn',
  };

  Object.keys(mappings).forEach((sourceToken) => {
    if (balances[sourceToken]) {
      const targetToken = mappings[sourceToken];

      balances[targetToken] = BigNumber(balances[targetToken] || 0)
        .plus(BigNumber(balances[sourceToken]))
        .toString();

      delete balances[sourceToken];
    }
  });

  return balances;
}

export default {
  encodeParameters,
  decodeParameters,
  decodeResult,
  convertBalancesToFixed,
  convertBalancesToBigNumber,
  merge,
  sum,
  sumMultiBalanceOf,
  swapTokenAddresses,
  formatStellarAddresses,
  mapStellarTokenAddresses,
};
