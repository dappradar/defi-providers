import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import abi from './abi.json';
import util from '../../../../util/blockchainUtil';

import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOL_ADDRESSES = [
  '0xfa3df877f98ac5ecd87456a7accaa948462412f0',
  '0xa2F0E57d4cEAcF025E81C76f28b9Ad6E9Fbe8735',
  '0xFc9e2C63370D8deb3521922a7B2b60f4Cff7e75a',
  '0x9906589Ea8fd27504974b7e8201DF5bBdE986b03',
  '0xF3f65dFe0c8c8f2986da0FEc159ABE6fd4E700B4',
  '0x74ef28D635c6C5800DD3Cd62d4c4f8752DaACB09',
  '0xaEFc4e8cF655a182E8346B24c8AbcE45616eE0d2',
  '0xcCe0d62Ce14FB3e4363Eb92Db37Ff3630836c252',
  '0x0986B42F5f9C42FeEef66fC23eba9ea1164C916D',
  '0x63C1914bf00A9b395A2bF89aaDa55A5615A3656e',
  '0xA5037661989789d0310aC2B796fa78F1B01F195D',
  '0x2080AAa167e2225e1FC9923250bA60E19a180Fb2',
  '0x19260b9b573569dDB105780176547875fE9fedA3',
  '0xE0F2cc70E52f05eDb383313393d88Df2937DA55a',
  '0xdBF27fD2a702Cc02ac7aCF0aea376db780D53247',
  '0x0ff04189Ef135b6541E56f7C638489De92E9c778',
  '0x23c95678862a229fac088bd9705622d78130bc3e',
];
let tokens = {};

/*==================================================
  Helpers
  ==================================================*/

async function getTokens(address, block, web3) {
  try {
    const contract = new web3.eth.Contract(abi, address);
    if (!tokens[address]) {
      tokens[address] = [];
    }
    for (let i = tokens[address].length; ; i += 1) {
      try {
        if (!tokens[address][i]) {
          const token = await contract.methods.getToken(i).call(null, block);
          tokens[address].push(token.toLowerCase());
        }
      } catch {
        break;
      }
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 8606077) {
    return {};
  }

  try {
    tokens = basicUtil.readDataFromFile('cache/tokens.json', chain, provider);
  } catch {}

  await Promise.all(POOL_ADDRESSES.map((pool) => getTokens(pool, block, web3)));

  basicUtil.writeDataToFile(tokens, 'cache/tokens.json', chain, provider);

  let poolList = [];
  let idList = [];
  POOL_ADDRESSES.forEach((pool) => {
    poolList = poolList.concat(tokens[pool].map(() => pool));
    idList = idList.concat(
      Array.from({ length: tokens[pool].length }, (v, i) => i),
    );
  });

  const results = await util.executeMultiCallsOfMultiTargets(
    poolList,
    abi,
    'getTokenBalance',
    idList.map((id) => [id]),
    block,
    chain,
    web3,
  );

  const balanceResults = [];
  poolList.forEach((address, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: tokens[address][idList[index]],
        balance,
      });
    }
  });

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
