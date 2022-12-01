import nearAPI from 'near-api-js';

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
  near = await nearAPI.connect({
    networkId: 'mainnet',
    nodeUrl: module.exports.nodeUrl,
  });
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
  nodeUrl: '',
  near: near,
  eth: {
    getBlockNumber: getBlockNumber,
    getBlock: getBlock,
    callContractFunction: callContractFunction,
    Contract: Contract,
  },
  init: init,
};
