import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import aaveV3 from '../../../../util/calculators/aaveV3';
import erc4626Vault from '../../../../util/calculators/erc4626Vault';
import BigNumber from 'bignumber.js';

const START_BLOCK = 2786931;
const MARKETS = [
  '0x67f93d36792c49a4493652B91ad4bD59f428AD15',
  '0x9aFB91a3cfB9aBc8Cbc8429aB57b6593FE36E173',
  '0xEe9ec60657B714E3FAC5255a5443AC5EC7Ba5bB0',
];
const VAULTS = [
  '0x14efcc1ae56e2ff75204ef2fb0de43378d0beada',
  '0x085f80df643307e04f23281f6fdbfaa13865e852',
  '0x9ac2f0a564b7396a8692e1558d23a12d5a2abb1f',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  for (const market of MARKETS) {
    const marketBalances = await aaveV3.getTvl(market, block, chain, web3);

    for (const [key, value] of Object.entries(marketBalances)) {
      balances[key] = new BigNumber(balances[key] || 0).plus(value).toFixed();
    }
  }

  const vaultBalances = await erc4626Vault.getTvl(
    VAULTS,
    block,
    chain,
    provider,
    web3,
  );

  for (const [key, value] of Object.entries(vaultBalances)) {
    balances[key] = new BigNumber(balances[key] || 0).plus(value).toFixed();
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
