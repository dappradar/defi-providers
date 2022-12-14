import BigNumber from 'bignumber.js';
import abi from './abi.json';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const CAULDRON_CONTRACTS = [
  '0xf8049467f3a9d50176f4816b20cddd9bb8a93319', // bsc
  '0x692cf15f80415d83e8c0e139cabcda67fcc12c90', // bsc
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < 12763666) {
    return {};
  }

  const tokenBalances = {};
  const results = await util.executeCallOfMultiTargets(
    CAULDRON_CONTRACTS,
    abi,
    'totalCollateralShare',
    [],
    block,
    chain,
    web3,
  );
  const tokenAddresses = await util.executeCallOfMultiTargets(
    CAULDRON_CONTRACTS,
    abi,
    'collateral',
    [],
    block,
    chain,
    web3,
  );
  results.forEach((result, index) => {
    const balance = BigNumber(result || 0);
    if (balance.isGreaterThan(0)) {
      const token = tokenAddresses[index].toLowerCase();
      if (tokenBalances[token]) {
        tokenBalances[token] = tokenBalances[token].plus(balance);
      } else {
        tokenBalances[token] = balance;
      }
    }
  });

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );

  return { balances };
}

export { tvl };
