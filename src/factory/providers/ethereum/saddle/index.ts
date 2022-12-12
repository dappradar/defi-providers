import BigNumber from 'bignumber.js';
import POOL_ABI from './abi.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';

const POOL_ADDRESSES = [
  '0x4f6A43Ad7cba042606dECaCA730d4CE0A57ac62e',
  '0x3911f80530595fbd01ab1516ab61255d75aeb066',
  '0xdec2157831D6ABC3Ec328291119cc91B337272b5',
  '0xa6018520eaacc06c30ff2e1b3ee2c7c22e64196a',
];
let tokens = {};

async function getTokens(address, block, web3) {
  try {
    const contract = new web3.eth.Contract(POOL_ABI, address);
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
  if (block < 11685572) {
    return {};
  }

  try {
    tokens = basicUtil.readDataFromFile('pairs.json', chain, provider);
  } catch {}

  await Promise.all(POOL_ADDRESSES.map((pool) => getTokens(pool, block, web3)));
  await basicUtil.writeDataToFile(tokens, 'pools.json', chain, provider);

  let poolList = [];
  let idList = [];
  POOL_ADDRESSES.forEach((pool) => {
    poolList = poolList.concat(tokens[pool].map((token) => pool));
    idList = idList.concat(
      Array.from({ length: tokens[pool].length }, (v, i) => i),
    );
  });

  const results = await util.executeMultiCallsOfMultiTargets(
    poolList,
    POOL_ABI,
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
