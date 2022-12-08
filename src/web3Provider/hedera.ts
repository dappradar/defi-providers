import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';
import serviceData from '../util/data';
import { Injectable } from '@nestjs/common';

const nodeUrl = serviceData[`HEDERA_NODE_URL`];

@Injectable()
export class Hedera {
  static async call(method, params) {
    try {
      const queries = params
        ? `?${Object.entries(params)
            .filter(([value]) => value)
            .map(([key, value]) => `${key}=${value}`)
            .join('&')}`
        : '';
      const res = await fetch(`${nodeUrl}/api/v1/${method}${queries}`).then(
        (res) => res.json(),
      );

      return res;
    } catch {
      return null;
    }
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

  async getBalance(account, timestamp) {
    const res = await Hedera.call('balances', {
      'account.id': account,
      timestamp: timestamp == 'latest' ? null : timestamp,
    });

    let balance = BigNumber(0);
    res.balances.forEach((value) => {
      if (value && value.account && value.balance) {
        balance = balance.plus(value.balance);
      }
    });

    return balance;
  }

  async getBalances(account, timestamp) {
    const res = await Hedera.call('balances', {
      'account.id': account,
      timestamp: timestamp == 'latest' ? null : timestamp,
    });

    const balances = {};
    res.balances.forEach((data) => {
      if (data && data.account && data.balance) {
        balances['hbar'] = BigNumber(balances['hbar'] || 0).plus(data.balance);
      }
      data.tokens.forEach((token) => {
        if (token.balance > 0) {
          balances[token.token_id] = BigNumber(
            balances[token.token_id] || 0,
          ).plus(token.balance);
        }
      });
    });

    const tokenBalances = [];
    Object.keys(balances).forEach((token) => {
      tokenBalances.push({
        token,
        balance: balances[token],
      });
    });

    return tokenBalances;
  }

  async getTokenBalance(account, address, timestamp) {
    if (address.toLowerCase() == 'hbar') {
      return await this.getBalance(account, timestamp);
    }

    const res = await Hedera.call('balances', {
      'account.id': account,
      timestamp: timestamp == 'latest' ? null : timestamp,
    });

    let balance = BigNumber(0);
    res.balances.forEach((data) => {
      data.tokens.forEach((token) => {
        if (token.token_id == address && token.balance > 0) {
          balance = balance.plus(token.balance);
        }
      });
    });

    return balance;
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
          call: async (timestamp = null) => {
            const res = await Hedera.call(`tokens/${this.address}`, {
              timestamp,
            });
            return res.total_supply;
          },
        };
      },
      balanceOf: (account) => {
        return {
          call: async (timestamp = null) => {
            const res = await Hedera.call(`tokens/${this.address}/balances`, {
              'account.id': account,
              timestamp,
            });

            let balance = BigNumber(0);
            res.balances.forEach((value) => {
              if (value && value.account && value.balance) {
                balance = balance.plus(value.balance);
              }
            });

            return balance.toFixed();
          },
        };
      },
    };
  }
}
