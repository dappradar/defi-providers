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
import { sendLog } from './logger';
import formatter from './formatter';

let underlyingData = {};
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Calls EVM smart contract function and returns its result
 *
 * @param target - The address of the smart contract to call
 * @param ABI - The json interface for the contract to instantiate
 * @param method - The smart contract method to call
 * @param params - The array of parameters to use in smart contract method call
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param web3 - The Web3 object
 * @returns The return value(s) of the smart contract method.
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
    sendLog({
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
    sendLog({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tryExecuteMultiCallsOfTarget`,
      endpoint: 'tryExecuteMultiCallsOfTarget',
    });
    return Array.from({ length: params.length }, () => null);
  }
}

/**
 * Calls EVM smart contract function [params.length] times and returns its results in array.
 *
 * @param target - The address of the smart contract to call
 * @param ABI - The json interface for the contract to instantiate
 * @param method - The smart contract method to call
 * @param params - The array of parameters or the array of parameters arrays to use in smart contract method call
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param web3 - The Web3 object
 * @returns The array of return value(s) of the smart contract method.
 *
 */
async function ExecuteMultiCallsOfTarget(
  target: string,
  ABI: any,
  method: string,
  params: any[] | any[][],
  block: number,
  chain: string,
  web3: Web3,
): Promise<any> {
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
    sendLog({
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
    sendLog({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tryExecuteDifferentCallsOfTarget`,
      endpoint: 'tryExecuteDifferentCallsOfTarget',
    });
    return Array.from({ length: params.length }, () => null);
  }
}

async function ExecuteDifferentCallsOfTarget(
  target,
  ABI,
  methods,
  params,
  block,
  chain,
  web3,
) {
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
        MULTICALL_ABI,
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
    sendLog({
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
    sendLog({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tryExecuteMultiCallsOfMultiTargets`,
      endpoint: 'tryExecuteMultiCallsOfMultiTargets',
    });
    return Array.from({ length: targets.length }, () => null);
  }
}

async function ExecuteMultiCallsOfMultiTargets(
  targets,
  ABI,
  method,
  params,
  block,
  chain,
  web3,
) {
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
              return await contract.methods[method](...subParams[index]).call(
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
        MULTICALL_ABI,
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
    sendLog({
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
    sendLog({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tryExecuteDifferentCallsOfMultiTargets`,
      endpoint: 'tryExecuteDifferentCallsOfMultiTargets',
    });
    return Array.from({ length: targets.length }, () => null);
  }
}

async function ExecuteDifferentCallsOfMultiTargets(
  targets,
  ABI,
  methods,
  params,
  block,
  chain,
  web3,
) {
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
                ...subParams[index],
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
        MULTICALL_ABI,
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
    sendLog({
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
    console.log(e);
    sendLog({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tryExecuteCallOfMultiTargets`,
      endpoint: 'tryExecuteCallOfMultiTargets',
    });
    return Array.from({ length: targets.length }, () => null);
  }
}

async function ExecuteCallOfMultiTargets(
  targets,
  ABI,
  method,
  param,
  block,
  chain,
  web3,
) {
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
        MULTICALL_ABI,
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
    sendLog({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: ExecuteCallOfMultiTargets`,
      endpoint: 'ExecuteCallOfMultiTargets',
    });
    return null;
  }
}

async function GetTokenBalance(address, token, block, web3) {
  try {
    const contract = new web3.eth.Contract(ERC20_ABI, token);
    const balance = await contract.methods.balanceOf(address).call(null, block);
    return {
      token: token.toLowerCase(),
      balance: new BigNumber(balance),
    };
  } catch {
    return null;
  }
}

async function GetTokenBalancesOfEachHolder(
  holders,
  tokens,
  block,
  chain,
  web3,
) {
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

async function GetTokenBalancesOfHolders(holders, tokens, block, chain, web3) {
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
        BULK_BALANCE_ABI,
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
    sendLog({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: GetTokenBalancesOfHolders`,
      endpoint: 'GetTokenBalancesOfHolders',
    });
  }

  return balanceResults;
}

async function GetTokenBalances(holder, tokens, block, chain, web3) {
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
        MULTIBALANCES_ABI,
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
    console.log(e);
    sendLog({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: GetTokenBalances`,
      endpoint: 'GetTokenBalances',
    });
  }

  return balanceResults;
}

async function GetBalancesOfHolders(holders, block, chain, web3) {
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
        BULK_BALANCE_ABI,
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
    sendLog({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: GetBalancesOfHolders`,
      endpoint: 'GetBalancesOfHolders',
    });
  }

  return balanceResults;
}

async function GetUnderlyingBalance(token, balance, block, chain, web3) {
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
    const contract = new web3.eth.Contract(UNI_ABI, token);
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
    const contract = new web3.eth.Contract(CURVE128_ABI, token);
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
    const contract = new web3.eth.Contract(CURVE256_ABI, token);
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
    const contract = new web3.eth.Contract(ONEINCH_ABI, token);
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
          const tokenContract = new web3.eth.Contract(ERC20_ABI, address);
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
    const contract = new web3.eth.Contract(CTOKEN_ABI, token);
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
    const contract = new web3.eth.Contract(CTOKEN_ABI, token);
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
    const contract = new web3.eth.Contract(ATOKEN_ABI, token);
    if (!underlyingData[key].underlyingAsset) {
      underlyingData[key].underlyingAsset = (
        await contract.methods.UNDERLYING_ASSET_ADDRESS().call()
      ).toLowerCase();
    }
    const underlyingContract = new web3.eth.Contract(
      ERC20_ABI,
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
    const contract = new web3.eth.Contract(CURVE256_ABI, token);
    const minter = await contract.methods.minter().call(null, block);
    const minter_contract = new web3.eth.Contract(CURVE256_ABI, minter);
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
    const lpTokenContract = new web3.eth.Contract(BEEFY_VAULT_ABI, token);
    const lpTokenOwner = await lpTokenContract.methods
      .owner()
      .call(null, block);
    const lpTokenTotalSupply = await lpTokenContract.methods
      .totalSupply()
      .call(null, block);
    const ratio = balance.div(BigNumber(lpTokenTotalSupply.toString()));

    const ownerContract = new web3.eth.Contract(
      SOLARBEAM_STABLE_SWAP_POOL_ABI,
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

async function ConvertToUnderlyings(tokenBalances, block, chain, web3) {
  try {
    underlyingData = JSON.parse(fs.readFileSync('./token01.json', 'utf8'));
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

  fs.writeFile(
    './token01.json',
    JSON.stringify(underlyingData, null, 2),
    'utf8',
    function (err) {
      if (err) {
        console.error(err);
      }
    },
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

async function GetTotalSupply(token, block, web3) {
  try {
    const contract = new web3.eth.Contract(ERC20_ABI, token);
    const totalSupply = await contract.methods.totalSupply().call(null, block);
    return {
      token: token.toLowerCase(),
      totalSupply: new BigNumber(totalSupply),
    };
  } catch {
    return null;
  }
}

async function GetTokenTotalSupplies(tokens, block, chain, web3) {
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
        BULK_METADATA_ABI,
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
    sendLog({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: GetTokenTotalSupplies`,
      endpoint: 'GetTokenTotalSupplies',
    });
  }

  return totalSupplyResults;
}

async function getLogs(fromBlock, toBlock, topic, target, web3) {
  const logs = await web3.eth.getPastLogs({
    fromBlock: fromBlock,
    toBlock: toBlock,
    topics: [topic],
    address: target,
  });

  return {
    ethCallCount: null,
    output: logs,
  };
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
};
