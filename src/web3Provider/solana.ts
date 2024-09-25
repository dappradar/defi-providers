import BigNumber from 'bignumber.js';
import { Injectable } from '@nestjs/common';
import { config, nodeUrls } from '../app.config';
import Bottleneck from 'bottleneck';
import { log } from '../util/logger/logger';

const nodeUrl = nodeUrls.SOLANA_NODE_URL;
const solanaBottleNeckMinTime = config.SOLANA_BOTTLENECK_MIN_TIME;

const limiter = new Bottleneck({
  minTime: solanaBottleNeckMinTime,
});

@Injectable()
export class Solana {
  getNodeUrl() {
    log.info({
      message: 'Fetching Solana node URL',
      detail: 'solana - Fetched Solana node URL.',
      endpoint: 'solana.getNodeUrl',
    });
    return nodeUrl;
  }

  async call(method, params) {
    return limiter.schedule(async () => {
      try {
        log.info({
          message: `Calling method: ${method} with params: ${JSON.stringify(
            params,
          )}`,
          detail: `solana - API call initiated.`,
          endpoint: 'solana.call',
        });

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
          log.error({
            message: `Error in method ${method}: ${res.error.message}`,
            detail: `solana - API call encountered an error.`,
            endpoint: 'solana.call',
          });

          throw res.error;
        }

        return res.result;
      } catch (e) {
        log.error({
          message: `Exception in method ${method}: ${e.message}`,
          detail: `solana - API call failed with exception.`,
          endpoint: 'solana.call',
        });
        return null;
      }
    });
  }

  async getBlockNumber() {
    const res = await this.call('getSlot', []);
    log.info({
      message: `Fetched block number: ${res}`,
      detail: `solana - Fetched block number using getSlot.`,
      endpoint: 'solana.getBlockNumber',
    });
    return res;
  }

  async getBlock(slotNumber) {
    let slot = slotNumber || 0;
    if (slotNumber == 'latest') {
      slot = await this.getBlockNumber();
    }
    let res;
    while (true) {
      res = await this.call('getBlockTime', [slot]);

      if (res && !res.error) {
        log.info({
          message: `Found block at slot ${slot} with timestamp: ${res}`,
          detail: `solana - Block found successfully.`,
          endpoint: 'solana.getBlock',
        });
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

  async call(method, params) {
    return limiter.schedule(async () => {
      try {
        log.info({
          message: `Calling method: ${method} with params: ${JSON.stringify(
            params,
          )} for contract ${this.address}`,
          detail: `solana - Contract API call initiated.`,
          endpoint: 'solana.Contract.call',
        });

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
          log.error({
            message: `Error in method ${method}: ${res.error.message} for contract ${this.address}`,
            detail: `solana - Contract API call encountered an error.`,
            endpoint: 'solana.Contract.call',
          });
          throw res.error;
        }

        return res.result;
      } catch (e) {
        log.error({
          message: `Exception in method ${method}: ${e.message} for contract ${this.address}`,
          detail: `solana - Contract API call failed with exception.`,
          endpoint: 'solana.Contract.call',
        });
        return null;
      }
    });
  }

  get methods() {
    return {
      totalSupply: () => {
        return {
          call: async () => {
            const res = await this.call('getTokenSupply', [this.address]);
            log.info({
              message: `Total supply fetched: ${res.value.amount} for contract ${this.address}`,
              detail: `solana - Fetched total supply of contract.`,
              endpoint: 'solana.Contract.methods.totalSupply.call',
            });
            return res.value.amount;
          },
        };
      },
      balanceOf: (account) => {
        return {
          call: async () => {
            const res = await this.call('getTokenAccountsByOwner', [
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

            log.info({
              message: `Balance fetched for account ${account}: ${balance.toFixed()} for contract ${
                this.address
              }`,
              detail: `solana - Balance fetched successfully.`,
              endpoint: 'solana.Contract.methods.balanceOf.call',
            });

            return balance.toFixed();
          },
        };
      },
    };
  }
}
