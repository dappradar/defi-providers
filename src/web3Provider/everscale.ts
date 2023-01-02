import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';
import { nodeUrls } from '../app.config';
import { Injectable } from '@nestjs/common';

const nodeUrl = nodeUrls.EVERSCALE_NODE_URL;

@Injectable()
export class Everscale {
  async getBlockNumber() {
    return Math.floor(Date.now() / 1000);
  }
  async getBlock(timestamp) {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (timestamp == 'latest') {
      return {
        number: currentTimestamp,
        timestamp: currentTimestamp,
      };
    }
    return {
      number: timestamp || currentTimestamp,
      timestamp: timestamp || currentTimestamp,
    };
  }
  async getBalances(account) {
    const res = await fetch(`${nodeUrl}/address/${account}/balances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 100,
        offset: 0,
      }),
    })
      .then((res) => res.json())
      .then((res) => res.balances);

    return res.map((data) => ({
      token: data.rootAddress,
      balance: BigNumber(data.amount),
    }));
  }
  async getTokenData(address) {
    const res = await fetch(
      `${nodeUrl}/root_contract/root_address/${address}`,
    ).then((res) => res.json());
    return res;
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
            const res = await fetch(
              `${nodeUrl}/root_contract/root_address/${this.address}`,
            ).then((res) => res.json());
            return BigNumber(res.totalSupply)
              .times(10 ** res.decimals)
              .toFixed();
          },
        };
      },
    };
  }
}
