import BigNumber from 'bignumber.js';
import ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { log } from '../../../../util/logger/logger';

const TREASURY_ADDRESSES = [
  '0x886CE997aa9ee4F8c2282E182aB72A705762399D',
  '0x31F8Cc382c9898b273eff4e0b7626a6987C846E8',
];
const STAKING_ADDRESSES = [
  '0x0822F3C03dcc24d200AFF33493Dc08d0e1f274A2', // Old Staking Contract
  '0xFd31c7d00Ca47653c6Ce64Af53c1571f9C36566a', // New Staking Contract
];
const ADAI = '0x028171bca77440897b824ca71d1c56cac55b68a3';
const OHM_DAI_SLP = '0x34d7d7aaf50ad4944b70b320acb24c95fa2def7c';
const OHM = '0x383518188c0c6d7730d91b2c03a03c837814a899';
const TOKENS = [
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  '0x34d7d7aaf50ad4944b70b320acb24c95fa2def7c', // OHM_DAI_SLP
  '0x853d955acef822db058eb8505911ed77f175b99e', // FRAX
  '0x2dce0dda1c2f98e0f171de8333c3c6fe1bbf4877', // OHM_FRAX_UNIV2
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
];
const AAVE_ALLOCATOR = '0x0e1177e47151be72e5992e0975000e73ab5fd9d4';
const ONSEN_ALLOCATOR = '0x0316508a1b5abf1CAe42912Dc2C8B9774b682fFC';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 12085272) {
    return {};
  }
  try {
    let holderList = [AAVE_ALLOCATOR];
    let tokenList = [ADAI];
    TREASURY_ADDRESSES.forEach((treasury) => {
      holderList = holderList.concat(TOKENS.map((token) => treasury));
      tokenList = tokenList.concat(TOKENS);
    });
    STAKING_ADDRESSES.forEach((staking) => {
      holderList = holderList.concat(staking);
      tokenList = tokenList.concat(OHM);
    });

    const [results, onsenBalance] = await Promise.all([
      util.getTokenBalancesOfHolders(holderList, tokenList, block, chain, web3),
      util.executeCall(
        ONSEN_ALLOCATOR,
        ABI,
        'totalValueDeployed',
        [],
        block,
        chain,
        web3,
      ),
    ]);

    const balance = BigNumber(onsenBalance || 0);
    if (balance.isGreaterThan(0)) {
      results.push({
        token: OHM_DAI_SLP,
        balance,
      });
    }

    const tokenBalances = {};
    formatter.sumMultiBalanceOf(tokenBalances, results);
    const balances = await util.convertToUnderlyings(
      tokenBalances,
      block,
      chain,
      provider,
      web3,
    );
    return { balances };
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tvl of ethereum/olympus`,
      endpoint: 'tvl',
    });
  }
}
export { tvl };
