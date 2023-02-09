import { TezosToolkit } from '@taquito/taquito';
import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { nodeUrls } from '../app.config';

const TZKT_API = 'https://api.tzkt.io/v1';
let tezosRPC: TezosToolkit;

@Injectable()
export class Tezos implements OnModuleInit {
  async onModuleInit() {
    tezosRPC = new TezosToolkit(nodeUrls.TEZOS_NODE_URL);
  }
  public async getBlockNumber() {
    const res = (await tezosRPC.rpc.getBlockHeader()).level;
    return res;
  }

  public async getBlock(levelNumber) {
    let level = Math.max(2, levelNumber || 0);
    if (levelNumber == 'latest') {
      level = (await tezosRPC.rpc.getBlockHeader()).level;
    }
    let res;
    while (true) {
      res = await tezosRPC.rpc.getBlockHeader({ block: level.toString() });

      if (res) {
        break;
      }
      level += 1;
    }
    return {
      number: level,
      timestamp: Math.round(new Date(res.timestamp).getTime() / 1000),
    };
  }

  public async getBalance(account, levelNumber) {
    if (levelNumber == 'latest') {
      return await fetch(`${TZKT_API}/accounts/${account}/balance`)
        .then((res) => res.json())
        .then((res) => BigNumber(res));
    }
    return await fetch(
      `${TZKT_API}/accounts/${account}/balance_history/${levelNumber}`,
    )
      .then((res) => res.json())
      .then((res) => BigNumber(res));
  }

  public async getTokenBalance(token, account, levelNumber) {
    const params =
      '&token.tokenId=0&balance.ne=0&sort.desc=balance&select=account.address as address,balance';
    if (levelNumber == 'latest') {
      return await fetch(
        `${TZKT_API}/tokens/balances?token.contract=${token}&account=${account}${params}`,
      ).then((res) => res.json());
    }
    return await fetch(
      `${TZKT_API}/tokens/historical_balances/${levelNumber}?token.contract=${token}&account=${account}${params}`,
    ).then((res) => res.json());
  }

  public async getAllTokensBalances(account, levelNumber) {
    let tokenBalances = {};
    const params =
      '&balance.ne=0&sort.desc=balance&select=token.contract.address as token,token.tokenId as tokenId,balance';
    if (levelNumber == 'latest') {
      tokenBalances = await fetch(
        `${TZKT_API}/tokens/balances?account=${account}${params}`,
      ).then((res) => res.json());
    } else {
      tokenBalances = await fetch(
        `${TZKT_API}/tokens/historical_balances/${levelNumber}?account=${account}${params}`,
      ).then((res) => res.json());
    }
    return Object.values(tokenBalances).map((token: any) => {
      return {
        token: `${token.token}_${token.tokenId}`,
        balance: BigNumber(token.balance),
      };
    });
  }

  public async getHolders(token, levelNumber) {
    const params =
      '&token.tokenId=0&balance.ne=0&sort.desc=balance&limit=10000&select=account.address as address,balance';
    if (levelNumber == 'latest') {
      return await fetch(
        `${TZKT_API}/tokens/balances?token.contract=${token}${params}`,
      ).then((res) => res.json());
    }
    return await fetch(
      `${TZKT_API}/tokens/historical_balances/${levelNumber}?token.contract=${token}${params}`,
    ).then((res) => res.json());
  }

  Contract = Contract;
}

class Contract {
  abi;
  address;
  contract;
  methods;
  constructor(abi, address) {
    this.abi = abi;
    this.address = address;
  }

  public async init() {
    this.contract = await tezosRPC.wallet.at(this.address);
    const storage = await this.contract.storage();
    const address = this.address;
    const storageAtLevel = {};
    this.methods = {};

    for (const key in storage) {
      this.methods[key] = () => {
        return {
          call: async function (options = null, level = null) {
            if (level) {
              try {
                if (!storageAtLevel[level]) {
                  storageAtLevel[level] = await fetch(
                    `${TZKT_API}/contracts/${address}/storage?level=${level}`,
                  ).then((res) => res.json());
                }
                return storageAtLevel[level][key];
              } catch {
                return null;
              }
            }
            return storage[key];
          },
        };
      };
    }

    this.methods.totalSupply = () => {
      return {
        call: async function () {
          const data = await fetch(
            `${TZKT_API}/tokens?contract=${address}&select=metadata,totalSupply`,
          ).then((res) => res.json());
          return data[0].totalSupply;
        },
      };
    };

    this.methods.getBigmap = (name, key = null) => {
      return {
        call: async function (options = null, level = null) {
          if (key) {
            const result = await fetch(
              `${TZKT_API}/contracts/${address}/bigmaps/${name}/historical_keys/${level}/${JSON.stringify(
                key,
              )}`,
            ).then((res) => res.json());
            return result;
          }
          let bigmap = [];
          let offset = 0;
          while (true) {
            try {
              const results = await fetch(
                `${TZKT_API}/contracts/${address}/bigmaps/${name}/historical_keys/${level}?offset=${offset}&limit=10000`,
              ).then((res) => res.json());
              if (results.length == 0) {
                break;
              }
              bigmap = bigmap.concat(results);
              offset += 10000;
            } catch {
              break;
            }
          }
          return bigmap;
        },
      };
    };

    try {
      const tokenData = await import(
        `./src/constants/tokens/tezos/${this.address}.json`
      );

      const keys = Object.keys(tokenData);
      for (const key of keys) {
        let data = storage;
        for (const method of tokenData[key]) {
          if (method.type) {
            data = await data.get(method.key);
          } else {
            data = data[method.key];
          }
        }

        this.methods[key] = () => {
          return {
            call: async function (options = null, level = null) {
              return data;
            },
          };
        };
      }
    } catch {}
  }
}
