import REGISTRY_ABI from './abi.json';
import BigNumber from 'bignumber.js';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const GATEWAY_REGISTRY_ADDRESS = '0xe80d347df1209a76dd9d2319d62912ba98c54ddd';
const REGISTRY_ADDRESS = '0x2d7b6c95afeffa50c068d50f89c5c0014e054f0a';
const REN_ADDRESS = '0x408e41876cccdc0f92210600ef50372656052a38';

const REN_BASIS = 1e19;
const REN_BOND = 10000;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const batchSize = 100;

  let nodes = {
    allNodes: [],
    lastDarknode: util.ZERO_ADDRESS,
  };
  try {
    nodes = await basicUtil.readFromCache('pools.json', chain, provider);
  } catch {}

  const allDarknodes = nodes.allNodes;
  let lastDarknode = nodes.lastDarknode;
  const contract = new web3.eth.Contract(REGISTRY_ABI, REGISTRY_ADDRESS);

  const filter = (address) =>
    address !== util.ZERO_ADDRESS && address !== lastDarknode;
  do {
    try {
      const darknodes = await contract.methods
        .getDarknodes(lastDarknode, batchSize)
        .call(null, block);
      if (lastDarknode !== util.ZERO_ADDRESS) {
        if (nodes.lastDarknode != lastDarknode) {
          allDarknodes.push(...darknodes.filter(filter));
          nodes.allNodes = allDarknodes;
          nodes.lastDarknode = lastDarknode;
        }
      }
      [lastDarknode] = darknodes.slice(-1);
    } catch (e) {
      break;
    }
  } while (lastDarknode !== util.ZERO_ADDRESS);
  await basicUtil.savedIntoCache(nodes, 'pools.json', chain, provider);

  const balances = {};

  const tokens = await util.executeCall(
    GATEWAY_REGISTRY_ADDRESS,
    REGISTRY_ABI,
    'getRenTokens',
    [util.ZERO_ADDRESS, 0],
    block,
    chain,
    web3,
  );

  const results = await util.getTokenTotalSupplies(tokens, block, chain, web3);
  results.forEach((result) => {
    if (result) {
      balances[result.token] = result.totalSupply.toFixed();
    }
  });

  balances[REN_ADDRESS] = BigNumber(
    allDarknodes.length * REN_BOND * REN_BASIS,
  ).toFixed();
  return { balances };
}

export { tvl };
