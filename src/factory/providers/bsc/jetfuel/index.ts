import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import CHEF_ABI from './abi/abi.json';
import UNITROLLER_ABI from './abi/unitroller.json';
import FTOKEN_ABI from './abi/ftoken.json';
import VAULT_ABI from './abi/vault.json';
import VAULTS from './currentVaults.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const UNITROLLER_ADDRESS = '0x67340bd16ee5649a37015138b3393eb5ad17c195';
const CHEF_ADDRESS = '0x86f4bC1EBf2C209D12d3587B7085aEA5707d4B56';
const WBNB_ADDRESS = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
let ftokens = {};

async function getTokens(address, block, web3) {
  try {
    if (!ftokens[address]) {
      const contract = new web3.eth.Contract(FTOKEN_ABI, address);
      try {
        const token = await contract.methods.underlying().call(null, block);
        ftokens[address] = token.toLowerCase();
      } catch {
        ftokens[address] = WBNB_ADDRESS;
      }
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 2863020) {
    return {};
  }

  const contract = new web3.eth.Contract(CHEF_ABI, CHEF_ADDRESS);
  let poolLength;
  try {
    poolLength = await contract.methods.poolLength().call(null, block);
  } catch {
    return {};
  }

  let pools = [];
  try {
    pools = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  for (let first = pools.length; first < poolLength; first += 300) {
    const last = Math.min(poolLength, first + 300);
    const poolCalls = [];
    for (let start = first; start < last; start += 1) {
      poolCalls.push(contract.methods.poolInfo(start).call());
    }
    try {
      const poolResults = await Promise.all(poolCalls);
      poolResults.forEach((result) => {
        pools.push(result.token);
      });
    } catch {
      break;
    }
  }

  basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  const tokenBalances = {};
  poolLength = pools.length;
  for (let first = 0; first < poolLength; first += 100) {
    const last = Math.min(poolLength, first + 100);
    const balanceResults = await util.getTokenBalances(
      CHEF_ADDRESS,
      pools.slice(first, last),
      block,
      chain,
      web3,
    );

    formatter.sumMultiBalanceOf(tokenBalances, balanceResults);
  }

  try {
    try {
      ftokens = basicUtil.readDataFromFile(
        'cache/markets.json',
        chain,
        provider,
      );
    } catch {}

    const unitrollerContract = new web3.eth.Contract(
      UNITROLLER_ABI,
      UNITROLLER_ADDRESS,
    );
    const markets = await unitrollerContract.methods
      .getAllMarkets()
      .call(null, block);
    await Promise.all(markets.map((market) => getTokens(market, block, web3)));

    const results = await util.executeCallOfMultiTargets(
      markets,
      FTOKEN_ABI,
      'getCash',
      [],
      block,
      chain,
      web3,
    );

    const balanceResults = [];

    markets.forEach((market, index) => {
      const balance = BigNumber(results[index] || 0);
      if (balance.isGreaterThan(0)) {
        balanceResults.push({
          token: ftokens[market],
          balance,
        });
      }
    });

    formatter.sumMultiBalanceOf(tokenBalances, balanceResults);

    basicUtil.writeDataToFile(ftokens, 'cache/markets.json', chain, provider);
  } catch {}

  try {
    const valutAddresses = Object.keys(VAULTS);
    const results = await util.executeCallOfMultiTargets(
      valutAddresses,
      VAULT_ABI,
      'balance',
      [],
      block,
      chain,
      web3,
    );

    const balanceResults = [];

    valutAddresses.forEach((address, index) => {
      const balance = BigNumber(results[index] || 0);
      if (balance.isGreaterThan(0)) {
        balanceResults.push({
          token: VAULTS[address],
          balance,
        });
      }
    });

    formatter.sumMultiBalanceOf(tokenBalances, balanceResults);
  } catch {}

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );

  return { balances };
}

export { tvl };
