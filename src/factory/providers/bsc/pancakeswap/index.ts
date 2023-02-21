import BigNumber from 'bignumber.js';
import * as chef from './chef';
import * as v1 from './v1';
import * as v2 from './v2';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOLS = [
  '0x73feaa1ee314f8c655e354234017be2193c9e24e',
  '0x45c54210128a065de780c4b0df3d16664f7f859e',
  '0x009cf7bc57584b7998236eff51b98a168dcea9b0',
  '0xa5f8c5dbd5f286960b9d90548680ae5ebff07652',
  '0xcafeb6f310039968a120d8c095c40a55e85f518c',
];
const CAKE_ADDRESS = '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, date, chain, provider, web3 } = params;

  if (block < 600615) {
    return {};
  }
  const balances = {};

  const cakeBalances = await util.getTokenBalancesOfHolders(
    POOLS,
    Array(POOLS.length).fill(CAKE_ADDRESS),
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, cakeBalances, chain, provider);

  const results = await Promise.all([
    chef.getBalances(block, chain, provider, web3),
    // v1.getBalances(block, date, chain, provider, web3),
    v2.getBalances(block, date, chain, provider, web3),
  ]);

  console.log(results.length);
  results.forEach((result) => {
    if (result) {
      for (const token in result) {
        if (!balances[token]) {
          balances[token] = BigNumber(0);
        }
        balances[token] = balances[token].plus(result[token]);
      }
    }
  });

  for (const token in balances) {
    if (balances[token].isLessThan(1000000)) {
      delete balances[token];
    } else {
      balances[token] = balances[token].toFixed();
    }
  }

  return { balances };
}

export { tvl };
