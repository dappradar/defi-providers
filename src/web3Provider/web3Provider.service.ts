import { Injectable } from '@nestjs/common';
import { nodeUrls } from '../app.config';
import { Everscale } from './everscale';
import { Hedera } from './hedera';
import { Near } from './near';
import { Solana } from './solana';
import { Stacks } from './stacks';
import { Tezos } from './tezos';
import Web3 from 'web3';
import { Wax } from './wax';
import { Aptos } from './aptos';

const webSocketConfig = {
  timeout: 60000,
  clientConfig: {
    maxReceivedFrameSize: 1000000000,
    maxReceivedMessageSize: 1000000000,
    keepalive: true,
    keepaliveInterval: 60000,
  },
  reconnect: {
    auto: true,
    delay: 5000,
    maxAttempts: 5,
    onTimeout: false,
  },
};

const mappedWeb3 = new Map();
@Injectable()
export class Web3ProviderService {
  constructor(
    private readonly everscale: Everscale,
    private readonly hedera: Hedera,
    private readonly near: Near,
    private readonly solana: Solana,
    private readonly stacks: Stacks,
    private readonly tezos: Tezos,
    private readonly wax: Wax,
    private readonly aptos: Aptos,
  ) {}

  async getWeb3(chain = 'ethereum') {
    if (!!mappedWeb3.get(chain)) {
      return mappedWeb3.get(chain);
    }
    return await this.createWeb3Instance(chain);
  }

  async createWeb3Instance(chain = 'ethereum', url = null) {
    let node_url;
    url
      ? (node_url = url)
      : (node_url =
          nodeUrls[`${chain.toUpperCase()}_NODE_URL`] ||
          nodeUrls[`ETHEREUM_NODE_URL`]);

    let web3;
    console.log(nodeUrls[`${chain.toUpperCase()}_NODE_URL`]);
    switch (chain) {
      case 'everscale': {
        web3 = { eth: this.everscale };
        web3.nodeUrl = node_url;
        break;
      }
      case 'hedera': {
        web3 = { eth: this.hedera };
        break;
      }
      case 'near': {
        web3 = { eth: this.near };
        break;
      }
      case 'wax': {
        web3 = { eth: this.wax };
        break;
      }
      case 'solana': {
        web3 = { eth: this.solana };
        break;
      }
      case 'stacks': {
        web3 = { eth: this.stacks };
        break;
      }
      case 'aptos': {
        web3 = { eth: this.aptos };
        break;
      }
      case 'tezos': {
        web3 = { eth: this.tezos };
        await web3.eth.onModuleInit();
        break;
      }
      default: {
        if (node_url.startsWith('ws')) {
          web3 = new Web3(
            new Web3.providers.WebsocketProvider(node_url, webSocketConfig),
          );
        } else {
          web3 = new Web3(new Web3.providers.HttpProvider(node_url));
        }
      }
    }
    mappedWeb3.set(chain, web3);
    return web3;
  }
  async changeInstance(chainName: string) {
    const allEnv = Object.keys(process.env);
    const possibleUrls = [];
    allEnv.forEach((key) => {
      if (key.startsWith(`${chainName.toUpperCase()}_NODE_URL`)) {
        possibleUrls.push(process.env[key]);
      }
    });
    if (possibleUrls.length > 1) {
      const nodeUrl = possibleUrls.filter(
        (possibleUrl) =>
          possibleUrl !== nodeUrls[`${chainName.toUpperCase()}_NODE_URL`],
      );
      nodeUrls[`${chainName.toUpperCase()}_NODE_URL`] = nodeUrl[0];
      await this.createWeb3Instance(chainName, nodeUrl[0]);
    }
  }

  checkNodeUrl(chain: string) {
    return !nodeUrls[`${chain.toUpperCase()}_NODE_URL`];
  }
}
