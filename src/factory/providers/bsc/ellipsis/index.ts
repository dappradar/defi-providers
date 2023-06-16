import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import POOL_ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOL_ADDRESSES = [
  '0x160CAed03795365F3A589f10C379FfA7d75d4E76',
  '0x2477fb288c5b4118315714ad3c7fd7cc69b00bf9',
  '0x556ea0b4c06D043806859c9490072FaadC104b63',
  '0xc6a752948627becab5474a10821df73ff4771a49',
  '0x8D7408C2b3154F9f97fc6dd24cd36143908d1E52',
];
let pools = {};

async function getPoolTokens(address, web3) {
  try {
    const contract = new web3.eth.Contract(POOL_ABI, address);
    if (!pools[address]) {
      pools[address] = [];
    }
    for (let id = pools[address].length; ; id += 1) {
      try {
        const token = await contract.methods.coins(id).call();
        pools[address].push(token.toLowerCase());
      } catch {
        break;
      }
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 5936381) {
    return {};
  }

  try {
    pools = await basicUtil.readDataFromFile(
      'cache/pools.json',
      chain,
      provider,
    );
  } catch {}

  await Promise.all(POOL_ADDRESSES.map((pool) => getPoolTokens(pool, web3)));

  basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  let poolList = [];
  let idList = [];
  POOL_ADDRESSES.forEach((address) => {
    poolList = poolList.concat(
      Object.keys(pools[address]).map((id) => address),
    );
    idList = idList.concat(Object.keys(pools[address]));
  });

  const results = await util.executeMultiCallsOfMultiTargets(
    poolList,
    POOL_ABI,
    'balances',
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
        token: pools[address][idList[index]],
        balance,
      });
    }
  });

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults, chain, provider);

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
