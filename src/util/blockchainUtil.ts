import fs from 'fs';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import ERC20_ABI from '../constants/abi/erc20.json';
import UNI_ABI from '../constants/abi/uni.json';
import CURVE128_ABI from '../constants/abi/curve128.json';
import CURVE256_ABI from '../constants/abi/curve.json';
import ONEINCH_ABI from '../constants/abi/1inch.json';
import CTOKEN_ABI from '../constants/abi/cToken.json';
import ATOKEN_ABI from '../constants/abi/aToken.json';
import BULK_BALANCE_ABI from '../constants/abi/bulkBalance.json';
import MULTIBALANCES_ABI from '../constants/abi/multiBalances.json';
import BULK_METADATA_ABI from '../constants/abi/bulkMetaData.json';
import MULTICALL_ABI from '../constants/abi/multiCall.json';
import BEEFY_VAULT_ABI from '../constants/abi/beefyVault.json';
import SOLARBEAM_STABLE_SWAP_POOL_ABI from '../constants/abi/solarbeamStableSwapPool.json';
import data from './data';
import {
  WMAIN_ADDRESS,
  BULK_BALANCE_ADDRESSES,
  BULK_BALANCE_DEPOLYED,
  MULTIBALANCES_ADDRESSES,
  MULTIBALANCES_DEPOLYED,
  BULK_METADATA_ADDRESSES,
  BULK_METADATA_DEPOLYED,
  MULTICALL_ADDRESSES,
  MULTICALL_DEPOLYED,
} from '../constants/contracts.json';
import { log } from './logger/logger';
import formatter from './formatter';
import basicUtil from './basicUtil';

let underlyingData = {};
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Calls EVM smart contract method and returns its result
 *
 * @param target - The address of the smart contract to call
 * @param ABI - The json interface for the contract to instantiate
 * @param method - The smart contract method to call
 * @param params - The array of parameters to use in smart contract method call
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param web3 - The Web3 object
 * @returns The return value(s) of the smart contract method
 *
 */
async function ExecuteCall(
  target: string,
  ABI: any,
  method: string,
  params: any[],
  block: number,
  chain: string,
  web3: Web3,
): Promise<any> {
  try {
    if (block < MULTICALL_DEPOLYED[chain]) {
      const contract = new web3.eth.Contract(ABI, target);
      const result = await contract.methods[method](...params).call(
        null,
        block,
      );
      return result;
    } else {
      const contract = new web3.eth.Contract(
        MULTICALL_ABI as AbiItem[],
        MULTICALL_ADDRESSES[chain],
      );
      const method_abi = ABI.find((abi) => abi.name == method);
      const method_input_params = method_abi.inputs.map((input) => input.type);
      const result = await contract.methods
        .executeCall(
          target,
          `${method}(${method_input_params.join(',')})`,
          formatter.encodeParameters(method_input_params, params),
        )
        .call(null, block);
      return formatter.decodeResult(method_abi, result);
    }
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: ExecuteCall`,
      endpoint: 'ExecuteCall',
    });
    return null;
  }
}

async function tryExecuteMultiCallsOfTarget(
  contract,
  target,
  signature,
  method_input_params,
  params,
  block,
) {
  try {
    return await contract.methods
      .executeMultiCallsOfTarget(
        target,
        Array.from({ length: params.length }, () => signature),
        params.map((param) =>
          formatter.encodeParameters(method_input_params, param),
        ),
      )
      .call(null, block);
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tryExecuteMultiCallsOfTarget`,
      endpoint: 'tryExecuteMultiCallsOfTarget',
    });
    return Array.from({ length: params.length }, () => null);
  }
}

/**
 * Calls EVM smart contract method with diferent parameters [params.length] times and returns its results in array
 *
 * @param target - The address of the smart contract to call
 * @param ABI - The json interface for the contract to instantiate
 * @param method - The smart contract method to call
 * @param params - The array of parameters or the array of parameter arrays to use in smart contract method calls
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param web3 - The Web3 object
 * @returns The array of return value(s) of the smart contract method calls
 *
 */
async function ExecuteMultiCallsOfTarget(
  target: string,
  ABI: any,
  method: string,
  params: (string | number)[] | (string | number)[][],
  block: number,
  chain: string,
  web3: Web3,
): Promise<any[]> {
  const paramLength = params.length;

  try {
    if (block < MULTICALL_DEPOLYED[chain]) {
      const contract = new web3.eth.Contract(ABI, target);
      let executeResults = [];
      for (let first = 0; first < paramLength; first += 25) {
        const last = Math.min(paramLength, first + 25);
        const results = await Promise.all(
          params.slice(first, last).map(async (param) => {
            try {
              return await contract.methods[method](...param).call(null, block);
            } catch {
              return null;
            }
          }),
        );
        executeResults = executeResults.concat(results);
      }
      return executeResults;
    } else {
      const contract = new web3.eth.Contract(
        MULTICALL_ABI as AbiItem[],
        MULTICALL_ADDRESSES[chain],
      );
      const method_abi = ABI.find((abi) => abi.name == method);
      const method_input_params = method_abi.inputs.map((input) => input.type);
      const signature = `${method}(${method_input_params.join(',')})`;
      const executeResults = [];
      for (let first = 0; first < paramLength; first += 500) {
        const last = Math.min(paramLength, first + 500);
        const calls = [];
        for (let start = first; start < last; start += 25) {
          const end = Math.min(last, start + 25);
          calls.push(
            tryExecuteMultiCallsOfTarget(
              contract,
              target,
              signature,
              method_input_params,
              params.slice(start, end),
              block,
            ),
          );
        }
        const results = await Promise.all(calls);
        results.forEach((result) => {
          result.forEach((res) => {
            executeResults.push(formatter.decodeResult(method_abi, res));
          });
        });
      }
      return executeResults;
    }
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: ExecuteMultiCallsOfTarget`,
      endpoint: 'ExecuteMultiCallsOfTarget',
    });
    return null;
  }
}
async function tryExecuteDifferentCallsOfTarget(
  contract,
  target,
  signatures,
  method_input_params,
  params,
  block,
) {
  try {
    return await contract.methods
      .executeMultiCallsOfTarget(
        target,
        signatures,
        params.map((param, index) =>
          formatter.encodeParameters(method_input_params[index], param),
        ),
      )
      .call(null, block);
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tryExecuteDifferentCallsOfTarget`,
      endpoint: 'tryExecuteDifferentCallsOfTarget',
    });
    return Array.from({ length: params.length }, () => null);
  }
}

/**
 * Calls EVM smart contract diferent methods [methods.length] times and returns its results in array
 *
 * @param target - The address of the smart contract to call
 * @param ABI - The json interface for the contract to instantiate
 * @param methods - The array of smart contract methods to call
 * @param params - The array of parameters or the array of parameter arrays to use in smart contract methods calls
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param web3 - The Web3 object
 * @returns The array of return value(s) of the smart contract methods calls
 *
 */
async function ExecuteDifferentCallsOfTarget(
  target: string,
  ABI: any,
  methods: string[],
  params: (string | number)[] | (string | number)[][],
  block: number,
  chain: string,
  web3: Web3,
): Promise<any[]> {
  const paramLength = params.length;

  try {
    if (block && block < MULTICALL_DEPOLYED[chain]) {
      let executeResults = [];
      for (let first = 0; first < paramLength; first += 25) {
        const last = Math.min(paramLength, first + 25);
        const subParams = params.slice(first, last);
        const results = await Promise.all(
          subParams.slice(first, last).map(async (param, index) => {
            try {
              const contract = new web3.eth.Contract(ABI, target);
              return await contract.methods[methods[first + index]](
                ...param,
              ).call(null, block);
            } catch {
              return null;
            }
          }),
        );
        executeResults = executeResults.concat(results);
      }
      return executeResults;
    } else {
      const contract = new web3.eth.Contract(
        MULTICALL_ABI as AbiItem[],
        MULTICALL_ADDRESSES[chain],
      );
      const method_abis = methods.map((method) =>
        ABI.find((abi) => abi.name == method),
      );
      const method_input_params = methods.map((method, index) =>
        method_abis[index].inputs.map((input) => input.type),
      );
      const signatures = methods.map(
        (method, index) => `${method}(${method_input_params[index].join(',')})`,
      );
      const executeResults = [];
      for (let first = 0; first < paramLength; first += 500) {
        const last = Math.min(paramLength, first + 500);
        const calls = [];
        for (let start = first; start < last; start += 25) {
          const end = Math.min(last, start + 25);
          calls.push(
            tryExecuteDifferentCallsOfTarget(
              contract,
              target,
              signatures.slice(start, end),
              method_input_params.slice(start, end),
              params.slice(start, end),
              block,
            ),
          );
        }
        const results = await Promise.all(calls);
        let resIndex = 0;
        results.forEach((result) => {
          result.forEach((res) => {
            executeResults.push(
              formatter.decodeResult(method_abis[first + resIndex], res),
            );
            resIndex += 1;
          });
        });
      }
      return executeResults;
    }
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: ExecuteDifferentCallsOfTarget`,
      endpoint: 'ExecuteDifferentCallsOfTarget',
    });
    return null;
  }
}

async function tryExecuteMultiCallsOfMultiTargets(
  contract,
  targets,
  signature,
  method_input_params,
  params,
  block,
) {
  try {
    return await contract.methods
      .executeMultiCallsOfMultiTarget(
        targets,
        Array.from({ length: targets.length }, () => signature),
        params.map((param) =>
          formatter.encodeParameters(method_input_params, param),
        ),
      )
      .call(null, block);
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tryExecuteMultiCallsOfMultiTargets`,
      endpoint: 'tryExecuteMultiCallsOfMultiTargets',
    });
    return Array.from({ length: targets.length }, () => null);
  }
}

/**
 * Calls EVM smart contract method for diferent addresses [targets.length] times and returns its results in array
 *
 * @param targets - The array of addresses of the smart contract to call
 * @param ABI - The json interface for the contract to instantiate
 * @param method - The smart contract method to call
 * @param params - The array of parameters or the array of parameter arrays to use in smart contract methods calls
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param web3 - The Web3 object
 * @returns The array of return value(s) of the smart contract methods calls
 *
 */
async function ExecuteMultiCallsOfMultiTargets(
  targets: string[],
  ABI: any,
  method: string,
  params: (string | number)[] | (string | number)[][],
  block: number,
  chain: string,
  web3: Web3,
): Promise<any[]> {
  const targetLength = targets.length;

  try {
    if (block < MULTICALL_DEPOLYED[chain]) {
      let executeResults = [];
      for (let first = 0; first < targetLength; first += 25) {
        const last = Math.min(targetLength, first + 25);
        const subParams = params.slice(first, last);
        const results = await Promise.all(
          targets.slice(first, last).map(async (target, index) => {
            try {
              const contract = new web3.eth.Contract(ABI, target);
              return await contract.methods[method](...[subParams[index]]).call(
                null,
                block,
              );
            } catch {
              return null;
            }
          }),
        );
        executeResults = executeResults.concat(results);
      }
      return executeResults;
    } else {
      const contract = new web3.eth.Contract(
        MULTICALL_ABI as AbiItem[],
        MULTICALL_ADDRESSES[chain],
      );
      const method_abi = ABI.find((abi) => abi.name == method);
      const method_input_params = method_abi.inputs.map((input) => input.type);
      const signature = `${method}(${method_input_params.join(',')})`;
      const executeResults = [];
      for (let first = 0; first < targetLength; first += 500) {
        const last = Math.min(targetLength, first + 500);
        const calls = [];
        for (let start = first; start < last; start += 25) {
          const end = Math.min(last, start + 25);
          calls.push(
            tryExecuteMultiCallsOfMultiTargets(
              contract,
              targets.slice(start, end),
              signature,
              method_input_params,
              params.slice(start, end),
              block,
            ),
          );
        }
        const results = await Promise.all(calls);
        results.forEach((result) => {
          result.forEach((res) => {
            executeResults.push(formatter.decodeResult(method_abi, res));
          });
        });
      }
      return executeResults;
    }
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: ExecuteMultiCallsOfMultiTargets`,
      endpoint: 'ExecuteMultiCallsOfMultiTargets',
    });
    return null;
  }
}

async function tryExecuteDifferentCallsOfMultiTargets(
  contract,
  targets,
  signatures,
  method_input_params,
  params,
  block,
) {
  try {
    return await contract.methods
      .executeMultiCallsOfMultiTarget(
        targets,
        signatures,
        params.map((param, index) =>
          formatter.encodeParameters(method_input_params[index], param),
        ),
      )
      .call(null, block);
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tryExecuteDifferentCallsOfMultiTargets`,
      endpoint: 'tryExecuteDifferentCallsOfMultiTargets',
    });
    return Array.from({ length: targets.length }, () => null);
  }
}

/**
 * Calls EVM smart contract diferent methods for diferent addresses [targets.length] times and returns its results in array
 *
 * @param targets - The array of addresses of the smart contract to call
 * @param ABI - The json interface for the contract to instantiate
 * @param methods - The array of smart contract methods to call
 * @param params - The array of parameters or the array of parameter arrays to use in smart contract methods calls
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param web3 - The Web3 object
 * @returns The array of return value(s) of the smart contract methods calls
 *
 */
async function ExecuteDifferentCallsOfMultiTargets(
  targets: string[],
  ABI: any,
  methods: string[],
  params: (string | number)[] | (string | number)[][],
  block: number,
  chain: string,
  web3: Web3,
): Promise<any[]> {
  const targetLength = targets.length;

  try {
    if (block && block < MULTICALL_DEPOLYED[chain]) {
      let executeResults = [];
      for (let first = 0; first < targetLength; first += 25) {
        const last = Math.min(targetLength, first + 25);
        const subParams = params.slice(first, last);
        const results = await Promise.all(
          targets.slice(first, last).map(async (target, index) => {
            try {
              const contract = new web3.eth.Contract(ABI, target);
              return await contract.methods[methods[first + index]](
                ...[subParams[index]],
              ).call(null, block);
            } catch {
              return null;
            }
          }),
        );
        executeResults = executeResults.concat(results);
      }
      return executeResults;
    } else {
      const contract = new web3.eth.Contract(
        MULTICALL_ABI as AbiItem[],
        MULTICALL_ADDRESSES[chain],
      );
      const method_abis = methods.map((method) =>
        ABI.find((abi) => abi.name == method),
      );
      const method_input_params = methods.map((method, index) =>
        method_abis[index].inputs.map((input) => input.type),
      );
      const signatures = methods.map(
        (method, index) => `${method}(${method_input_params[index].join(',')})`,
      );
      const executeResults = [];
      for (let first = 0; first < targetLength; first += 500) {
        const last = Math.min(targetLength, first + 500);
        const calls = [];
        for (let start = first; start < last; start += 25) {
          const end = Math.min(last, start + 25);
          calls.push(
            tryExecuteDifferentCallsOfMultiTargets(
              contract,
              targets.slice(start, end),
              signatures.slice(start, end),
              method_input_params.slice(start, end),
              params.slice(start, end),
              block,
            ),
          );
        }
        const results = await Promise.all(calls);
        let resIndex = 0;
        results.forEach((result) => {
          result.forEach((res) => {
            executeResults.push(
              formatter.decodeResult(method_abis[first + resIndex], res),
            );
            resIndex += 1;
          });
        });
      }
      return executeResults;
    }
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: ExecuteDifferentCallsOfMultiTargets`,
      endpoint: 'ExecuteDifferentCallsOfMultiTargets',
    });
    return null;
  }
}

async function tryExecuteCallOfMultiTargets(
  contract,
  targets,
  signature,
  method_input_params,
  param,
  block,
) {
  try {
    return await contract.methods
      .executeCallsOfMultiTargets(
        targets,
        signature,
        formatter.encodeParameters(method_input_params, param),
      )
      .call(null, block);
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tryExecuteCallOfMultiTargets`,
      endpoint: 'tryExecuteCallOfMultiTargets',
    });
    return Array.from({ length: targets.length }, () => null);
  }
}

/**
 * Calls EVM smart contract method with same parameters for diferent addresses [targets.length] times and returns its results in array
 *
 * @param targets - The array of addresses of the smart contract to call
 * @param ABI - The json interface for the contract to instantiate
 * @param method - The smart contract method to call
 * @param param - The array of parameters to use in smart contract method call
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param web3 - The Web3 object
 * @returns - The array of return value(s) of the smart contract methods calls
 *
 */
async function ExecuteCallOfMultiTargets(
  targets: string[],
  ABI: any,
  method: string,
  param: (string | number)[],
  block: number,
  chain: string,
  web3: Web3,
): Promise<any[]> {
  const targetLength = targets.length;

  try {
    if (block < MULTICALL_DEPOLYED[chain]) {
      let executeResults = [];
      for (let first = 0; first < targetLength; first += 25) {
        const last = Math.min(targetLength, first + 25);
        const results = await Promise.all(
          targets.slice(first, last).map(async (target) => {
            try {
              const contract = new web3.eth.Contract(ABI, target);
              return await contract.methods[method](...param).call(null, block);
            } catch {
              return null;
            }
          }),
        );
        executeResults = executeResults.concat(results);
      }
      return executeResults;
    } else {
      const contract = new web3.eth.Contract(
        MULTICALL_ABI as AbiItem[],
        MULTICALL_ADDRESSES[chain],
      );
      const method_abi = ABI.find((abi) => abi.name == method);
      const method_input_params = method_abi.inputs.map((input) => input.type);
      const signature = `${method}(${method_input_params.join(',')})`;
      const executeResults = [];
      for (let first = 0; first < targetLength; first += 500) {
        const last = Math.min(targetLength, first + 500);
        const calls = [];
        for (let start = first; start < last; start += 25) {
          const end = Math.min(last, start + 25);
          calls.push(
            tryExecuteCallOfMultiTargets(
              contract,
              targets.slice(start, end),
              signature,
              method_input_params,
              param,
              block,
            ),
          );
        }
        const results = await Promise.all(calls);
        results.forEach((result) => {
          result.forEach((res) => {
            executeResults.push(formatter.decodeResult(method_abi, res));
          });
        });
      }
      return executeResults;
    }
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: ExecuteCallOfMultiTargets`,
      endpoint: 'ExecuteCallOfMultiTargets',
    });
    return null;
  }
}

/**
 * Calls ERC20 balanceOf method for provided address
 *
 * @param address - The wallet address
 * @param token - The token address
 * @param block - The block number for which data is requested
 * @param web3 - The Web3 object
 * @returns - The token and token balance of address
 *
 */
async function GetTokenBalance(
  address: string,
  token: string,
  block: number,
  web3: Web3,
): Promise<{
  token: string;
  balance: BigNumber;
}> {
  try {
    const contract = new web3.eth.Contract(ERC20_ABI as AbiItem[], token);
    const balance = await contract.methods.balanceOf(address).call(null, block);
    return {
      token: token.toLowerCase(),
      balance: new BigNumber(balance),
    };
  } catch {
    return null;
  }
}

/**
 * Calls ERC20 balanceOf method for every token for provided addresses
 *
 * @param holders - The array of addresses
 * @param tokens - The array of token addresses
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param web3 - The Web3 object
 * @returns - The array of tokens and tokens balances of holders
 *
 */
async function GetTokenBalancesOfEachHolder(
  holders: string[],
  tokens: string[],
  block: number,
  chain: string,
  web3: Web3,
): Promise<{ token: string; balance: BigNumber }[]> {
  const holderList = [];
  const tokenList = [];

  holders.forEach((holder) => {
    holderList.push(...Array(tokens.length).fill(holder));
    tokenList.push(...tokens);
  });

  return await GetTokenBalancesOfHolders(
    holderList,
    tokenList,
    block,
    chain,
    web3,
  );
}

/**
 * Calls ERC20 balanceOf method for [i] token for provided addresses
 *
 * @param holders - The array of addresses
 * @param tokens - The array of token addresses
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param web3 - The Web3 object
 * @returns - The array of tokens and tokens balances of holders
 *
 */
async function GetTokenBalancesOfHolders(
  holders: string[],
  tokens: string[],
  block: number,
  chain: string,
  web3: Web3,
): Promise<{ token: string; balance: BigNumber }[]> {
  let balanceResults = [];
  const tokenLength = tokens.length;

  try {
    if (block < BULK_BALANCE_DEPOLYED[chain]) {
      for (let first = 0; first < tokenLength; first += 25) {
        const last = Math.min(tokenLength, first + 25);
        try {
          const results = await Promise.all(
            holders
              .slice(first, last)
              .map((address, index) =>
                GetTokenBalance(address, tokens[first + index], block, web3),
              ),
          );
          balanceResults = balanceResults.concat(results);
        } catch {}
      }
    } else {
      const contract = new web3.eth.Contract(
        BULK_BALANCE_ABI as AbiItem[],
        BULK_BALANCE_ADDRESSES[chain],
      );
      for (let first = 0; first < tokenLength; first += 500) {
        const last = Math.min(tokenLength, first + 500);
        const calls = [];
        for (let start = first; start < last; start += 25) {
          const end = Math.min(last, start + 25);
          calls.push(
            contract.methods
              .tokenBalancesManyTokensManyHolders(
                holders.slice(start, end),
                tokens.slice(start, end),
              )
              .call(null, block),
          );
        }
        try {
          const results = await Promise.all(calls);
          results.forEach((result) => {
            result = result.map((balance) => ({
              token: balance.token_address.toLowerCase(),
              balance: new BigNumber(balance.balance),
            }));
            balanceResults = balanceResults.concat(result);
          });
        } catch {}
      }
    }
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: GetTokenBalancesOfHolders`,
      endpoint: 'GetTokenBalancesOfHolders',
    });
  }

  return balanceResults;
}

/**
 * Calls ERC20 balanceOf method for every token for provided address
 *
 * @param holder - The wallet address
 * @param tokens - The array of token addresses
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param web3 - The Web3 object
 * @returns - The array of tokens and tokens balances of holder
 *
 */
async function GetTokenBalances(
  holder: string,
  tokens: string[],
  block: number,
  chain: string,
  web3: Web3,
): Promise<{ token: string; balance: BigNumber }[]> {
  let balanceResults = [];
  const tokenLength = tokens.length;

  try {
    if (block < MULTIBALANCES_DEPOLYED[chain]) {
      for (let first = 0; first < tokenLength; first += 25) {
        const last = Math.min(tokenLength, first + 25);
        try {
          const results = await Promise.all(
            tokens
              .slice(first, last)
              .map((token) => GetTokenBalance(holder, token, block, web3)),
          );
          balanceResults = balanceResults.concat(results);
        } catch {}
      }
    } else {
      const multiContract = new web3.eth.Contract(
        MULTIBALANCES_ABI as AbiItem[],
        MULTIBALANCES_ADDRESSES[chain],
      );
      for (let first = 0; first < tokenLength; first += 500) {
        const last = Math.min(tokenLength, first + 500);
        const calls = [];
        for (let start = first; start < last; start += 25) {
          const end = Math.min(last, start + 25);
          calls.push(
            multiContract.methods
              .tokenBalances(holder, tokens.slice(start, end))
              .call(null, block),
          );
        }
        try {
          const results = await Promise.all(calls);
          results.forEach((result, startIndex) => {
            result = result.map((balance, index) => ({
              token: tokens[first + startIndex * 25 + index].toLowerCase(),
              balance: new BigNumber(balance),
            }));
            balanceResults = balanceResults.concat(result);
          });
        } catch {}
      }
    }
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: GetTokenBalances`,
      endpoint: 'GetTokenBalances',
    });
  }

  return balanceResults;
}

/**
 * Gets native coin balances for provided addresses
 *
 * @param holders - The array of addresses
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param web3 - The Web3 object
 * @returns - The array of tokens (wrapped native coins) and tokens balances of holder
 *
 */
async function GetBalancesOfHolders(
  holders: string[],
  block: number,
  chain: string,
  web3: Web3,
): Promise<{ token: string; balance: BigNumber }[]> {
  let balanceResults = [];
  const addressLength = holders.length;

  try {
    if (block < BULK_BALANCE_DEPOLYED[chain]) {
      for (let first = 0; first < addressLength; first += 25) {
        const last = Math.min(addressLength, first + 25);
        try {
          const results = await Promise.all(
            holders
              .slice(first, last)
              .map((address) => web3.eth.getBalance(address, block)),
          );
          balanceResults = balanceResults.concat(
            results.map((balance) => ({
              token: WMAIN_ADDRESS[chain],
              balance: new BigNumber(balance),
            })),
          );
        } catch {}
      }
    } else {
      const contract = new web3.eth.Contract(
        BULK_BALANCE_ABI as AbiItem[],
        BULK_BALANCE_ADDRESSES[chain],
      );
      for (let first = 0; first < addressLength; first += 500) {
        const last = Math.min(addressLength, first + 500);
        const calls = [];
        for (let start = first; start < last; start += 25) {
          const end = Math.min(last, start + 25);
          calls.push(
            contract.methods
              .ethBalances(holders.slice(start, end))
              .call(null, block),
          );
        }
        try {
          const results = await Promise.all(calls);
          results.forEach((result) => {
            balanceResults = balanceResults.concat(
              result.map((balance) => ({
                token: WMAIN_ADDRESS[chain],
                balance: BigNumber(balance.balance),
              })),
            );
          });
        } catch {}
      }
    }
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: GetBalancesOfHolders`,
      endpoint: 'GetBalancesOfHolders',
    });
  }
  return balanceResults;
}

/**
 * Gets underlying balance of various pools
 *
 * * @remarks
 * Tries to get underlying balance of various LP and other pools including Uniswap, Curve, One Inch, Beefy.
 *
 * @param token - The pool token address
 * @param balance - The pool token balance
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param web3 - The Web3 object
 * @returns - The array of underlying tokens and their balances
 *
 */
async function GetUnderlyingBalance(
  token: string,
  balance: BigNumber,
  block: number,
  chain: string,
  web3: any,
): Promise<{ token: string; balance: BigNumber }[]> {
  const key = `${data.CHAINS[chain].prefix}${token}`;
  let tries = 0;
  if (typeof underlyingData[key] == 'number') {
    tries = underlyingData[key];
    if (tries > 4) {
      return [
        {
          token,
          balance,
        },
      ];
    }
  }
  const newToken =
    !underlyingData[key] || typeof underlyingData[key] == 'number';
  if (newToken) {
    underlyingData[key] = {};
  }
  if (chain == 'tezos') {
    try {
      const contract = new web3.eth.Contract(null, token);
      await contract.init();
      const storage = await contract.methods.storage().call(null, block);
      if (!underlyingData[key].token) {
        underlyingData[key].token = storage.token_address;
      }
      return [
        {
          token: underlyingData[key].token,
          balance: balance.times(storage.token_pool).div(storage.total_supply),
        },
      ];
    } catch {}
    return [
      {
        token,
        balance,
      },
    ];
  }
  try {
    const contract = new web3.eth.Contract(UNI_ABI as AbiItem[], token);
    const reserves = await contract.methods.getReserves().call(null, block);
    if (!underlyingData[key].token0) {
      underlyingData[key].token0 = (
        await contract.methods.token0().call()
      ).toLowerCase();
    }
    if (!underlyingData[key].token1) {
      underlyingData[key].token1 = (
        await contract.methods.token1().call()
      ).toLowerCase();
    }
    const totalSupply = await contract.methods.totalSupply().call(null, block);
    const ratio = balance.div(BigNumber(totalSupply.toString()));
    const token0Balance = BigNumber(reserves._reserve0.toString()).times(ratio);
    const token1Balance = BigNumber(reserves._reserve1.toString()).times(ratio);
    return [
      {
        token: underlyingData[key].token0,
        balance: token0Balance,
      },
      {
        token: underlyingData[key].token1,
        balance: token1Balance,
      },
    ];
  } catch {}
  try {
    const contract = new web3.eth.Contract(CURVE128_ABI as AbiItem[], token);
    await contract.methods.coins(0).call();
    const totalSupply = await contract.methods.totalSupply().call(null, block);
    const ratio = balance.div(BigNumber(totalSupply.toString()));
    if (!underlyingData[key].coins) {
      underlyingData[key].coins = {};
    }
    for (let id = 0; ; id += 1) {
      try {
        if (!underlyingData[key].coins[id]) {
          underlyingData[key].coins[id] = (
            await contract.methods.coins(id).call()
          ).toLowerCase();
        }
      } catch {
        break;
      }
    }
    const coinBalances = await ExecuteMultiCallsOfTarget(
      token,
      CURVE128_ABI,
      'balances',
      Object.keys(underlyingData[key].coins).map((id) => [id]),
      block,
      chain,
      web3,
    );
    const balances = coinBalances.map((balance, index) => ({
      token: underlyingData[key].coins[index],
      balance: new BigNumber(balance).times(ratio),
    }));
    return balances;
  } catch {}
  try {
    const contract = new web3.eth.Contract(CURVE256_ABI as AbiItem[], token);
    await contract.methods.coins(0).call();
    const totalSupply = await contract.methods.totalSupply().call(null, block);
    const ratio = balance.div(BigNumber(totalSupply.toString()));
    if (!underlyingData[key].coins) {
      underlyingData[key].coins = {};
    }
    for (let id = 0; ; id += 1) {
      try {
        if (!underlyingData[key].coins[id]) {
          underlyingData[key].coins[id] = (
            await contract.methods.coins(id).call()
          ).toLowerCase();
        }
      } catch {
        break;
      }
    }
    const coinBalances = await ExecuteMultiCallsOfTarget(
      token,
      CURVE256_ABI,
      'balances',
      Object.keys(underlyingData[key].coins).map((id) => [id]),
      block,
      chain,
      web3,
    );
    const balances = coinBalances.map((balance, index) => ({
      token: underlyingData[key].coins[index],
      balance: new BigNumber(balance).times(ratio),
    }));
    return balances;
  } catch {}
  try {
    const contract = new web3.eth.Contract(ONEINCH_ABI as AbiItem[], token);
    const balances = [];
    await contract.methods.tokens(0).call();
    const totalSupply = await contract.methods.totalSupply().call(null, block);
    const ratio = balance.div(BigNumber(totalSupply.toString()));
    if (!underlyingData[key].tokens) {
      underlyingData[key].tokens = {};
    }
    for (let id = 0; ; id += 1) {
      try {
        if (!underlyingData[key].tokens[id]) {
          underlyingData[key].tokens[id] = (
            await contract.methods.tokens(id).call()
          ).toLowerCase();
        }
        let address = underlyingData[key].tokens[id];
        let tokenBalance;
        if (
          address == ZERO_ADDRESS ||
          address == '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
        ) {
          address = WMAIN_ADDRESS[chain];
          tokenBalance = await web3.eth.getBalance(token, block);
        } else {
          const tokenContract = new web3.eth.Contract(
            ERC20_ABI as AbiItem[],
            address,
          );
          tokenBalance = await tokenContract.methods
            .balanceOf(token)
            .call(null, block);
        }
        balances.push({
          token: address,
          balance: new BigNumber(tokenBalance).times(ratio),
        });
      } catch {
        break;
      }
    }
    return balances;
  } catch {}
  try {
    const contract = new web3.eth.Contract(CTOKEN_ABI as AbiItem[], token);
    const exchangeRate = await contract.methods
      .exchangeRateStored()
      .call(null, block);

    if (!underlyingData[key].underlying) {
      underlyingData[key].underlying = (
        await contract.methods.underlying().call()
      ).toLowerCase();
    }

    return [
      {
        token: underlyingData[key].underlying,
        balance: balance.times(exchangeRate).div(1e18),
      },
    ];
  } catch {}
  try {
    const contract = new web3.eth.Contract(CTOKEN_ABI as AbiItem[], token);
    let cash;
    try {
      cash = await contract.methods.getCash().call(null, block);
    } catch {
      try {
        cash = await contract.methods.balanceStrategy().call(null, block);
      } catch {
        cash = await contract.methods.balance().call(null, block);
      }
    }
    try {
      if (!underlyingData[key].underlying) {
        underlyingData[key].underlying = (
          await contract.methods.underlying().call()
        ).toLowerCase();
      }
    } catch {
      if (!underlyingData[key].token) {
        underlyingData[key].token = (
          await contract.methods.token().call()
        ).toLowerCase();
      }
    }
    const totalSupply = await contract.methods.totalSupply().call(null, block);
    const ratio = balance.div(BigNumber(totalSupply.toString()));
    return [
      {
        token: underlyingData[key].underlying || underlyingData[key].token,
        balance: new BigNumber(cash).times(ratio),
      },
    ];
  } catch {}
  try {
    const contract = new web3.eth.Contract(ATOKEN_ABI as AbiItem[], token);
    if (!underlyingData[key].underlyingAsset) {
      underlyingData[key].underlyingAsset = (
        await contract.methods.UNDERLYING_ASSET_ADDRESS().call()
      ).toLowerCase();
    }
    const underlyingContract = new web3.eth.Contract(
      ERC20_ABI as AbiItem[],
      underlyingData[key].underlyingAsset,
    );
    const underlyingBalance = await underlyingContract.methods
      .balanceOf(token)
      .call(null, block);
    const totalSupply = await contract.methods.totalSupply().call(null, block);
    const ratio = balance.div(BigNumber(totalSupply.toString()));
    return [
      {
        token: underlyingData[key].underlyingAsset,
        balance: new BigNumber(underlyingBalance).times(ratio),
      },
    ];
  } catch {}
  try {
    const contract = new web3.eth.Contract(CURVE256_ABI as AbiItem[], token);
    const minter = await contract.methods.minter().call(null, block);
    const minter_contract = new web3.eth.Contract(
      CURVE256_ABI as AbiItem[],
      minter,
    );
    await minter_contract.methods.coins(0).call();
    const totalSupply = await contract.methods.totalSupply().call(null, block);
    const ratio = balance.div(BigNumber(totalSupply.toString()));
    if (!underlyingData[key].coins) {
      underlyingData[key].coins = {};
    }
    for (let id = 0; ; id += 1) {
      try {
        if (!underlyingData[key].coins[id]) {
          underlyingData[key].coins[id] = (
            await minter_contract.methods.coins(id).call()
          ).toLowerCase();
        }
      } catch {
        break;
      }
    }
    const coinBalances = await ExecuteMultiCallsOfTarget(
      minter,
      CURVE256_ABI,
      'balances',
      Object.keys(underlyingData[key].coins).map((id) => [id]),
      block,
      chain,
      web3,
    );
    const balances = coinBalances.map((balance, index) => ({
      token: underlyingData[key].coins[index],
      balance: new BigNumber(balance).times(ratio),
    }));
    return balances;
  } catch {}
  // Solarbeam stable swap pool farm
  try {
    const lpTokenContract = new web3.eth.Contract(
      BEEFY_VAULT_ABI as AbiItem[],
      token,
    );
    const lpTokenOwner = await lpTokenContract.methods
      .owner()
      .call(null, block);
    const lpTokenTotalSupply = await lpTokenContract.methods
      .totalSupply()
      .call(null, block);
    const ratio = balance.div(BigNumber(lpTokenTotalSupply.toString()));

    const ownerContract = new web3.eth.Contract(
      SOLARBEAM_STABLE_SWAP_POOL_ABI as AbiItem[],
      lpTokenOwner,
    );

    if (!underlyingData[key].tokens) {
      underlyingData[key].tokens = {};
      const tokens = await ownerContract.methods.getTokens().call(null, block);
      tokens.forEach((token, id) => {
        if (!underlyingData[key].tokens[id]) {
          underlyingData[key].tokens[id] = token.toLowerCase();
        }
      });
    }

    const tokenBalances = await ownerContract.methods
      .getTokenBalances()
      .call(null, block);

    const balances = tokenBalances.map((tokenBalance, index) => ({
      token: underlyingData[key].tokens[index],
      balance: new BigNumber(tokenBalance).times(ratio),
    }));

    return balances;
  } catch {}

  if (newToken) {
    underlyingData[key] = tries + 1;
  }
  return [
    {
      token,
      balance,
    },
  ];
}

/**
 * Gets underlying balances of various pools
 *
 * * @remarks
 * Tries to get underlying balance of various LP and other pools including Uniswap, Curve, One Inch, Beefy.
 *
 * @param tokenBalances - The pools and their balances
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param provider
 * @param web3 - The Web3 object
 * @returns - The underlying tokens and their balances
 *
 */
async function ConvertToUnderlyings(
  tokenBalances: { [key: string]: BigNumber },
  block: number,
  chain: string,
  provider: string,
  web3: Web3,
): Promise<{ [key: string]: string }> {
  try {
    underlyingData = basicUtil.readDataFromFile(
      'underlyingList.json',
      chain,
      provider,
    );
  } catch {}

  const getUnderlyings = [];
  for (const token in tokenBalances) {
    if (tokenBalances[token].isGreaterThan(0)) {
      getUnderlyings.push(
        GetUnderlyingBalance(token, tokenBalances[token], block, chain, web3),
      );
    }
  }

  const balanceResults = await Promise.all(getUnderlyings);
  basicUtil.writeDataToFile(
    underlyingData,
    'underlyingList.json',
    chain,
    provider,
  );

  const balances = {};

  for (const results of balanceResults) {
    for (const result of results) {
      if (result.token) {
        const token =
          result.token == ZERO_ADDRESS
            ? WMAIN_ADDRESS[chain] || ''
            : result.token;
        if (!balances[token]) {
          balances[token] = BigNumber(0);
        }
        balances[token] = balances[token].plus(result.balance);
      }
    }
  }

  for (const token in balances) {
    if (balances[token].isNaN()) {
      delete balances[token];
    } else if (balances[token].isLessThan(10)) {
      delete balances[token];
    } else {
      balances[token] = balances[token].toFixed();
    }
  }

  return balances;
}

/**
 * Calls ERC20 totalSupply method for the token
 *
 * @param token - The token address
 * @param block - The block number for which data is requested
 * @param web3 - The Web3 object
 * @returns - The token and tokens total supply
 *
 */
async function GetTotalSupply(
  token: string,
  block: number,
  web3: Web3,
): Promise<{ token: string; totalSupply: BigNumber }> {
  try {
    const contract = new web3.eth.Contract(ERC20_ABI as AbiItem[], token);
    const totalSupply = await contract.methods.totalSupply().call(null, block);
    return {
      token: token.toLowerCase(),
      totalSupply: new BigNumber(totalSupply),
    };
  } catch {
    return null;
  }
}

/**
 * Calls ERC20 totalSupply method for every token in the array
 *
 * @param tokens - The array of token addresses
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param web3 - The Web3 object
 * @returns - The array of tokens and tokens total supplies
 *
 */
async function GetTokenTotalSupplies(
  tokens: string[],
  block: number,
  chain: string,
  web3: Web3,
): Promise<{ token: string; totalSupply: BigNumber }[]> {
  let totalSupplyResults = [];
  const tokenLength = tokens.length;

  try {
    if (block < BULK_METADATA_DEPOLYED[chain]) {
      for (let first = 0; first < tokenLength; first += 25) {
        const last = Math.min(tokenLength, first + 25);
        try {
          const results = await Promise.all(
            tokens
              .slice(first, last)
              .map((token) => GetTotalSupply(token, block, web3)),
          );
          totalSupplyResults = totalSupplyResults.concat(results);
        } catch {}
      }
    } else {
      const metadataContract = new web3.eth.Contract(
        BULK_METADATA_ABI as AbiItem[],
        BULK_METADATA_ADDRESSES[chain],
      );
      for (let first = 0; first < tokenLength; first += 500) {
        const last = Math.min(tokenLength, first + 500);
        const calls = [];
        for (let start = first; start < last; start += 25) {
          const end = Math.min(last, start + 25);
          calls.push(
            metadataContract.methods
              .getTokensTotalSupply(tokens.slice(start, end))
              .call(null, block),
          );
        }
        try {
          const results = await Promise.all(calls);
          results.forEach((result) => {
            result = result.map((res) => ({
              token: res.token_address.toLowerCase(),
              totalSupply: new BigNumber(res.totalSupply),
            }));
            totalSupplyResults = totalSupplyResults.concat(result);
          });
        } catch {}
      }
    }
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: GetTokenTotalSupplies`,
      endpoint: 'GetTokenTotalSupplies',
    });
  }

  return totalSupplyResults;
}

/**
 * Gets past logs, matching the given options.
 *
 * @remarks
 * More: https://web3js.readthedocs.io/en/v1.2.11/web3-eth.html#getpastlogs
 *
 * @param fromBlock - The number of the earliest block to get logs
 * @param toBlock - The number of the latest block to get logs
 * @param topic - The value which must each appear in the log entries. The order is important
 * @param target - An address or a list of addresses to only get logs from particular account(s)
 * @param web3 - The Web3 object
 * @returns - The object with array of log objects
 *
 */
async function getLogs(
  fromBlock: number,
  toBlock: number,
  topic: string,
  target: string | string[],
  web3: Web3,
) {
  const logs = await web3.eth.getPastLogs({
    fromBlock: fromBlock,
    toBlock: toBlock,
    topics: [topic],
    address: target,
  });

  return {
    output: logs,
  };
}

async function getDecodedLogsParameters(
  fromBlock: number,
  toBlock: number,
  topic: string,
  target: string,
  typesArray: { type: string; name: string }[],
  web3: Web3,
  batchSize = 10000,
  chunkSize = 2,
) {
  const decodedLogsParameters = [];

  const calls = [];
  for (let i = fromBlock; i < toBlock; i += batchSize) {
    calls.push(
      getLogs(i, Math.min(i + batchSize - 1, toBlock), topic, target, web3),
    );
  }
  for (let i = 0; i < calls.length; i += chunkSize) {
    const chunk = calls.slice(i, i + chunkSize);

    const chunkLogs = await Promise.all(chunk);

    chunkLogs.forEach((logs) => {
      logs.output.forEach((log: { data: string }) => {
        const decodedLogParameters = web3.eth.abi.decodeParameters(
          typesArray,
          log.data,
        );
        decodedLogsParameters.push(decodedLogParameters);
      });
    });
  }

  return decodedLogsParameters;
}

export default {
  getUnderlyingBalance: GetUnderlyingBalance,
  convertToUnderlyings: ConvertToUnderlyings,
  getBalancesOfHolders: GetBalancesOfHolders,
  getTokenBalancesOfEachHolder: GetTokenBalancesOfEachHolder,
  getTokenBalancesOfHolders: GetTokenBalancesOfHolders,
  getTokenBalances: GetTokenBalances,
  getTokenTotalSupplies: GetTokenTotalSupplies,
  getTotalSupply: GetTotalSupply,
  executeCall: ExecuteCall,
  executeMultiCallsOfTarget: ExecuteMultiCallsOfTarget,
  executeDifferentCallsOfTarget: ExecuteDifferentCallsOfTarget,
  executeMultiCallsOfMultiTargets: ExecuteMultiCallsOfMultiTargets,
  executeDifferentCallsOfMultiTargets: ExecuteDifferentCallsOfMultiTargets,
  executeCallOfMultiTargets: ExecuteCallOfMultiTargets,
  ZERO_ADDRESS: ZERO_ADDRESS,
  getLogs,
  getDecodedLogsParameters,
};
