import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import aaveV3 from '../../../../util/calculators/aaveV3';
import erc4626Vault from '../../../../util/calculators/erc4626Vault';
import BigNumber from 'bignumber.js';

const START_BLOCK = 19356962;
const MARKETS = [
  '0x47223D4eA966a93b2cC96FFB4D42c22651FADFcf',
  '0x31063F7CA8ef4089Db0dEdf8D6e35690B468A611',
  '0x298ECDcb0369Aef75cBbdA3e46a224Cfe622E287',
];
const VAULTS = [
  '0xc42d337861878baa4dc820d9e6b6c667c2b57e8a',
  '0x1ab9e92cfde84f38868753d30ffc43f812b803c5',
  '0xc364fd9637fe562a2d5a1cbc7d1ab7f32be900ef',
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
