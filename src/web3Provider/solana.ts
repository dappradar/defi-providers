import BigNumber from 'bignumber.js';
import serviceData from '../util/data';
import { Injectable } from '@nestjs/common';

const nodeUrl = serviceData[`SOLANA_NODE_URL`];

@Injectable()
export class Solana {
  static async call(method, params) {
    try {
      const res = await fetch(nodeUrl, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: method,
          params: params,
        }),
      }).then((res) => res.json());

      if (res.error) {
        throw res.error;
      }

      return res.result;
    } catch {
      return null;
    }
  }

  async getBlockNumber() {
    const res = await Solana.call('getSlot', []);
    return res;
  }

  async getBlock(slotNumber) {
    let slot = slotNumber || 0;
    if (slotNumber == 'latest') {
      slot = await module.exports.eth.getBlockNumber();
    }
    let res;
    while (true) {
      res = await Solana.call('getBlockTime', [slot]);

      if (res && !res.error) {
        break;
      }
      slot += 1;
    }
    return {
      number: slot,
      timestamp: res,
    };
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
            const res = await Solana.call('getTokenSupply', [this.address]);
            return res.value.amount;
          },
        };
      },
      balanceOf: (account) => {
        return {
          call: async () => {
            const res = await Solana.call('getTokenAccountsByOwner', [
              account,
              {
                mint: this.address,
              },
              {
                encoding: 'jsonParsed',
              },
            ]);
            let balance = BigNumber(0);
            res.value.forEach((value) => {
              if (value && value.account && value.account.data) {
                balance = balance.plus(
                  value.account.data.parsed.info.tokenAmount.amount,
                );
              }
            });
            return balance.toFixed();
          },
        };
      },
    };
  }
}
