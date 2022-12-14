import BigNumber from 'bignumber.js';
import abi from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const ADDRESSES = {
  moonbeam: {
    pools: {
      ob3p: '0x04e274f709e1ae71aff4f994b4267143ec6a381a',
      ob3pbusd: '0x7e758319d46E0A053220e3728B3eE47a1979316a',
    },
    ignoredLps: ['0xe7a7dfb89f84a0cf850bcd399d0ec906ab232e9d'],
  },
};

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 352823) {
    return {};
  }

  const balances = {};
  const poolTokenBalances = await util.executeCallOfMultiTargets(
    Object.values(ADDRESSES.moonbeam.pools),
    abi,
    'getTokenBalances',
    [],
    block,
    chain,
    web3,
  );
  const poolTokens = await util.executeCallOfMultiTargets(
    Object.values(ADDRESSES.moonbeam.pools),
    abi,
    'getTokens',
    [],
    block,
    chain,
    web3,
  );

  const tokenBalances = [];
  const tokens = [];

  poolTokenBalances.forEach((balanceResult, index) => {
    if (balanceResult && poolTokens[index]) {
      tokenBalances.push(...balanceResult);
      tokens.push(...poolTokens[index]);
    }
  });

  tokens.forEach((token, i) => {
    const addr = token.toLowerCase();
    if (ADDRESSES['moonbeam'].ignoredLps.includes(addr)) {
      return;
    } else if (!balances[addr]) {
      balances[addr] = BigNumber(0);
    }
    balances[addr] = balances[addr].plus(tokenBalances[i]);
  });

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
