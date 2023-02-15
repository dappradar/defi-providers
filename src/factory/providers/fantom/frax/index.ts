import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import abi from './abi.json';
import BigNumber from 'bignumber.js';

const USDC = '0x04068da6c83afcfa0e13ba15a6696662335d5b75';
const DAI = '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e';
const CURVE_DAI_USDC = '0x8866414733f22295b7563f9c5299715d2d76caf4';
const contractAddresses = [
  '0x8dbc48743a05A6e615D9C39aEBf8C2b157aa31eA', //Spirit/Ola Lending AMO Fantom
  '0x51E6D09d5A1EcF8BE035BBCa82F77BfeC3c7672A', //Scream Lending AMO Fantom
  '0x48F0856e0E2D06fBCed5FDA10DD69092a500646B', //SpiritSwap Liquidity AMO Fantom
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 17759398) {
    return {};
  }

  const balances = {};

  // --- AMO's ---
  const usdcTvls = await util.executeCallOfMultiTargets(
    contractAddresses,
    abi,
    'borrowed_frax',
    [],
    block,
    chain,
    web3,
  );

  usdcTvls.forEach((usdcTvl) => {
    if (usdcTvl) {
      balances[USDC] = balances[USDC]
        ? BigNumber(balances[USDC]).plus(
            BigNumber(usdcTvl).dividedBy(1e12).toFixed(),
          )
        : BigNumber(usdcTvl).dividedBy(1e12).toFixed();
    }
  });

  const tokenBalances = await util.getTokenBalancesOfHolders(
    [
      '0x7a656b342e14f745e2b164890e88017e27ae7320',
      '0xbea9f78090bdb9e662d8cb301a00ad09a5b756e9',
    ],
    [
      '0x8866414733f22295b7563f9c5299715d2d76caf4',
      '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
    ],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  formatter.convertBalancesToFixed(balances);

  if (balances[CURVE_DAI_USDC]) {
    balances[DAI] = balances[CURVE_DAI_USDC];
    delete balances[CURVE_DAI_USDC];
  }

  return { balances };
}

export { tvl };
