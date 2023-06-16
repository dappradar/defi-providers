import BigNumber from 'bignumber.js';
import TRUEFI_ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import { log } from '../../../../util/logger/logger';

const POOLS = [
  '0xa1e72267084192db7387c8cc1328fade470e4149',
  '0xA991356d261fbaF194463aF6DF8f0464F8f1c742',
  '0x6002b1dcB26E7B1AA797A17551C6F487923299d7',
  '0x23696914Ca9737466D8553a2d619948f548Ee424',
];
let pools = {};

async function getTokens(address, web3) {
  try {
    if (!pools[address]) {
      const contract = new web3.eth.Contract(TRUEFI_ABI, address);
      let token;
      try {
        token = await contract.methods.token().call();
      } catch {
        try {
          token = await contract.methods.tru().call();
        } catch {}
      }
      pools[address] = token.toLowerCase();
    }
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: getTokens of ethereum/truefi`,
      endpoint: 'getTokens',
    });
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11280398) {
    return {};
  }

  try {
    pools = await basicUtil.readFromCache('cache/pairs.json', chain, provider);
  } catch {}

  await Promise.all(POOLS.map((pool) => getTokens(pool, web3)));

  await basicUtil.savedIntoCache(pools, 'cache/pairs.json', chain, provider);

  const results = await Promise.all([
    util.executeCallOfMultiTargets(
      POOLS,
      TRUEFI_ABI,
      'poolValue',
      [],
      block,
      chain,
      web3,
    ),
    util.executeCallOfMultiTargets(
      POOLS,
      TRUEFI_ABI,
      'stakeSupply',
      [],
      block,
      chain,
      web3,
    ),
  ]);

  const balanceResults = [];

  POOLS.forEach((address, index) => {
    const balance = BigNumber(results[0][index] || results[1][index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: pools[address],
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
