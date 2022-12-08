import * as nearAPI from 'near-api-js';
import serviceData from '../util/data';
import { Injectable, OnModuleInit } from '@nestjs/common';

let near;

@Injectable()
export class Near implements OnModuleInit {
  async onModuleInit() {
    const { connect } = nearAPI;
    const nodeUrl = serviceData[`NEAR_NODE_URL`];
    const connectionConfig = {
      networkId: 'mainnet',
      nodeUrl,
    };

    near = await connect(connectionConfig);
  }

  async getBlockNumber() {
    const block = await near.connection.provider.block({
      finality: 'final',
    });
    return block.header.height;
  }

  async getBlock(blockNumber) {
    const block = await near.connection.provider.block({
      blockId: blockNumber,
    });
    return {
      number: block.header.height,
      timestamp: Math.floor(block.header.timestamp / 10 ** 9),
    };
  }

  async callContractFunction(contract, functionName, args, blockNumber) {
    const response = await near.connection.provider.query({
      request_type: 'call_function',
      block_id: blockNumber,
      account_id: contract,
      method_name: functionName,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
    });
    return JSON.parse(Buffer.from(response.result).toString());
  }

  Contract = Contract;
}

class Contract {
  abi;
  address;
  constructor(abi, address) {
    this.abi = abi;
    this.address = address;
  }

  get methods() {
    return {
      totalSupply: () => {
        return {
          call: async () => {
            const blockNumber = await near.connection.provider.block({
              finality: 'final',
            });
            const response = await near.connection.provider.query({
              request_type: 'call_function',
              block_id: await blockNumber.header.height(),
              account_id: this.address,
              method_name: 'ft_total_supply',
              args_base64: Buffer.from(JSON.stringify({})).toString('base64'),
            });
            return JSON.parse(Buffer.from(response.result).toString());
          },
        };
      },
    };
  }
}
