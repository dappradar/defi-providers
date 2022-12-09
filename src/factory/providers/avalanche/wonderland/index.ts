import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const TREASURY_ADDRESS = '0x1c46450211CB2646cc1DA3c5242422967eD9e04c';
const DAO_ADDRESS = '0x78a9e536EBdA08b5b9EDbE5785C9D1D50fA3278C';
const TOKENS = [
  '0x130966628846BFd36ff31a822705796e8cb8C18D', // mim
  '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7', // wavax
  '0x113f413371fC4CC4C9d6416cf1DE9dFd7BF747Df', // mim-time
  '0x781655d802670bba3c89aebaaea59d3182fd755d', // wavax-mim
  '0x8ea6dd9482a49791e8c3d0f7c515bbd3be702f74', // MIM-WETH
  '0xf64e1c5B6E17031f5504481Ac8145F4c3eab4917', // wavax-time
  '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab', // WETH
  '0x4d308c46ea9f234ea515cc51f16fba776451cac8', // wmemo-mim
  '0xc7198437980c041c805a1edcba50c1ce5db95118', // USDT
  '0xce1bffbd5374dac86a2893119683f4911a2f7814', // SPELL
  '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd', // JOE
  '0xcbb424fd93cdec0ef330d8a8c985e8b147f62339', // wavax-mim
  '0x6cb6cb160bd629aaf07d2e51b3a435d909d01dd0', // mim-time
  '0xb599E3Cc5e7730865E74d78F2b9B67fDC627b743', // mim-??
  '0x0da67235dd5787d67955420c84ca1cecd4e5bb3b', // wMEMO
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;

  if (block < 3632168) {
    return {};
  }

  const results = await util.getTokenBalancesOfEachHolder(
    [TREASURY_ADDRESS, DAO_ADDRESS],
    TOKENS,
    block,
    chain,
    web3,
  );

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, results);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );

  return { balances };
}

export { tvl };
