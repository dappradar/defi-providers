import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import abi from './abi.json';
import util from '../../../../util/blockchainUtil';

import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const TOKENS = [
  '0x765de816845861e75a25fca122bb6898b8b1282a', // celo-dollar
  '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73', // celo-euro
  '0x471ece3750da237f93b8e339c536989b8978a438', // celo
];
const holder = '0xAF106F8D4756490E7069027315F4886cc94A8F73';
const HELPERS = ['0x43d067ed784D9DD2ffEda73775e2CC4c560103A1'];
let pools = {};

async function getUnderlyings(address, web3) {
  try {
    if (!pools[address]) {
      const contract = new web3.eth.Contract(abi, address);
      const underlying = await contract.methods
        .UNDERLYING_ASSET_ADDRESS()
        .call();
      pools[address] = underlying.toLowerCase();
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 3419586) {
    return {};
  }

  const balanceResults = await util.getTokenBalances(
    holder,
    TOKENS,
    block,
    chain,
    web3,
  );

  if (8955507 <= block) {
    const atokensInfos = await util.executeCallOfMultiTargets(
      HELPERS,
      abi,
      'getAllATokens',
      [],
      block,
      chain,
      web3,
    );
    let atokens = [];

    atokensInfos.forEach((infos) => {
      if (infos) {
        atokens = atokens.concat(
          infos.map((info) => info.tokenAddress || info.split(',')[1]),
        );
      }
    });

    try {
      pools = await basicUtil.readFromCache(
        'cache/pools.json',
        chain,
        provider,
      );
    } catch {}

    await Promise.all(atokens.map((address) => getUnderlyings(address, web3)));

    await basicUtil.saveIntoCache(pools, 'cache/pools.json', chain, provider);

    const results = await util.executeMultiCallsOfMultiTargets(
      atokens.map((address) => pools[address]),
      abi,
      'balanceOf',
      atokens.map((address) => [address]),
      block,
      chain,
      web3,
    );

    results.forEach((result, index) => {
      const balance = BigNumber(result || 0);
      if (balance.isGreaterThan(0)) {
        balanceResults.push({
          token: pools[atokens[index]],
          balance,
        });
      }
    });
  }

  const balances = {};

  formatter.sumMultiBalanceOf(balances, balanceResults, chain, provider);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
