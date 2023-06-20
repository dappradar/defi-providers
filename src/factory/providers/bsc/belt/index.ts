import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import VAULT_ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const VAULT_ADDRESSES = [
  '0x51bd63F240fB13870550423D208452cA87c44444',
  '0xAA20E8Cb61299df2357561C2AC2e1172bC68bc25',
  '0xa8Bb71facdd46445644C277F9499Dd22f6F0A30C',
  '0x9171Bf7c050aC8B4cf7835e51F7b4841DFB2cCD0',
  '0x55E1B1e49B969C018F2722445Cd2dD9818dDCC25',
  '0x7a59bf07D529A5FdBab67D597d63d7D5a83E61E5',
  '0x9A86fc508a423AE8a243445dBA7eD5364118AB1D',
];

let pools = {};

async function getTokens(address, web3) {
  try {
    if (!pools[address]) {
      const contract = new web3.eth.Contract(VAULT_ABI, address);
      pools[address] = (await contract.methods.token().call()).toLowerCase();
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 6543448) {
    return {};
  }

  const tokenBalances = {};

  try {
    pools = await basicUtil.readFromCache('cache/pools.json', chain, provider);
  } catch {}

  await Promise.all(VAULT_ADDRESSES.map((address) => getTokens(address, web3)));

  basicUtil.savedIntoCache(pools, 'cache/pools.json', chain, provider);

  const results = await util.executeCallOfMultiTargets(
    VAULT_ADDRESSES,
    VAULT_ABI,
    'calcPoolValueInToken',
    [],
    block,
    chain,
    web3,
  );

  const balanceResults = [];
  VAULT_ADDRESSES.forEach((address, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: pools[address],
        balance,
      });
    }
  });

  formatter.sumMultiBalanceOf(tokenBalances, balanceResults, chain, provider);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );

  return { balances };
}

export { tvl };
