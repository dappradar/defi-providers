import * as nearAPI from 'near-api-js';
import serviceData from '../data';

let near;

async function getBlockNumber() {
  if (!near) {
    await init();
  }
  const block = await near.connection.provider.block({
    finality: 'final',
  });
  return block.header.height;
}

async function getBlock(blockNumber) {
  const block = await near.connection.provider.block({
    blockId: blockNumber,
  });
  return {
    number: block.header.height,
    timestamp: Math.floor(block.header.timestamp / 10 ** 9),
  };
}

async function callContractFunction(contract, functionName, args, blockNumber) {
  if (!near) {
    await init();
  }
  const response = await near.connection.provider.query({
    request_type: 'call_function',
    block_id: blockNumber,
    account_id: contract,
    method_name: functionName,
    args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
  });
  return JSON.parse(Buffer.from(response.result).toString());
}

async function init() {
  const { connect } = nearAPI;

  const nodeUrl = serviceData[`NEAR_NODE_URL`];
  const connectionConfig = {
    networkId: 'mainnet',
    nodeUrl,
  };

  near = await connect(connectionConfig);
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
            return await callContractFunction(
              this.address,
              'ft_total_supply',
              {},
              await getBlockNumber(),
            );
          },
        };
      },
    };
  }
}

export default {
  near: near,
  eth: {
    getBlockNumber: getBlockNumber,
    getBlock: getBlock,
    callContractFunction: callContractFunction,
    Contract: Contract,
  },
  init: init,
};
