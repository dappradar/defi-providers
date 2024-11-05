import BigNumber from 'bignumber.js';
import { PromisePool } from '@supercharge/promise-pool';
import { request, gql } from 'graphql-request';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { ITvlReturn } from '../../interfaces/ITvl';
import FACTORY_ABI from '../../constants/abi/factory.json';
import PAIR_ABI from '../../constants/abi/uni.json';
import RESERVES_ABI from '../../constants/abi/uniReserves.json';
import BULK_RESERVES_ABI from '../../constants/abi/bulkReserves.json';
import {
  BULK_RESERVES_ADDRESSES,
  BULK_RESERVES_DEPOLYED,
} from '../../constants/contracts.json';
import basicUtil from '../basicUtil';
import util from '../blockchainUtil';
import { log } from '../logger/logger';
import { retryAsyncFunction, retryPromiseAll } from '../retry';

async function getPairs(factoryAddress, web3) {
  const limit = 30;
  let pairs = [];
  let iterationPairs = [];

  do {
    const start_after = pairs.length
      ? pairs[pairs.length - 1].asset_infos
      : undefined;

    const query = {
      limit,
      ...(start_after && { start_after }),
    };

    console.log('Query:', query);

    iterationPairs = await web3.eth
      .call(factoryAddress, 'pairs', query)
      .then((response) => response['pairs']);

    console.log('Fetched pairs:', iterationPairs);

    pairs = pairs.concat(iterationPairs);
  } while (iterationPairs.length > 100); //0);

  return pairs;
}

/**
 * Gets TVL of comonly used cosmos DEX clone
 *
 * @param factoryAddress - The address of factory
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param provider - the provider folder name
 * @param web3 - The Web3 object
 * @returns The standard balances object
 *
 */
async function getTvl(
  factoryAddress: string,
  block: number,
  chain: string,
  provider: string,
  web3: Web3,
): Promise<{ [key: string]: string }> {
  const balances = {};

  const pairs = await getPairs(factoryAddress, web3);
  console.log(pairs[0].asset_infos[0]);
  console.log(pairs[0].asset_infos[1]);
  return balances;
}

export default {
  getTvl,
};
