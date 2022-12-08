import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';
import serviceData from '../util/data';
import { Injectable } from '@nestjs/common';

const nodeUrl = serviceData[`STACKS_NODE_URL`];
@Injectable()
export class Stacks {
  async getBlockNumber() {
    const url = `${nodeUrl}/extended/v1/block`;
    const block = await fetch(url).then((res) => res.json());
    return block.total;
  }

  async getBlock(blockNumber) {
    const url = `${nodeUrl}/extended/v1/block/by_height/${blockNumber || 1}`;
    const block = await fetch(url).then((res) => res.json());
    return {
      number: block.height,
      timestamp: block.burn_block_time,
    };
  }

  async getAccountBalances(account, block) {
    const url = `${nodeUrl}/extended/v1/address/${account}/balances?until_block=${block}`;
    return fetch(url).then((res) => res.json());
  }

  extractBalances(accountBalances, balances, tokenAddressesFilter) {
    const stxToken = 'stx';
    if (!balances[stxToken]) {
      balances[stxToken] = BigNumber(0);
    }
    balances[stxToken] = BigNumber(balances[stxToken]).plus(
      BigNumber(accountBalances.stx.balance),
    );

    for (const token in accountBalances.fungible_tokens) {
      const tokenAddress = this.transformAddress(token);

      if (
        typeof tokenAddressesFilter === 'undefined' ||
        tokenAddressesFilter.includes(tokenAddress)
      ) {
        if (!balances[tokenAddress]) {
          balances[tokenAddress] = BigNumber(0);
        }
        balances[tokenAddress] = BigNumber(balances[tokenAddress]).plus(
          BigNumber(accountBalances.fungible_tokens[token].balance),
        );
      }
    }
  }

  transformAddress(token) {
    return token.substring(0, token.indexOf(':'));
  }

  Contract = Contract;
}
class Contract {
  abi: string;
  address: string;
  constructor(abi, address) {
    this.abi = abi;
    this.address = address;
  }

  get methods() {
    return {
      totalSupply: () => {
        return {
          call: async () => {
            const stacksAddress = this.address.split('.')[0];
            const contractName = this.address.split('.')[1];
            const functionName = 'get-total-supply';
            const url = `${nodeUrl}/v2/contracts/call-read/${stacksAddress}/${contractName}/${functionName}`;
            const result = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sender: stacksAddress,
                arguments: [],
              }),
            }).then((res) => res.json());

            const totalSupply = BigNumber(`0x${result.result.slice(8)}`);

            return totalSupply;
          },
        };
      },
    };
  }
}
