import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import BigNumber from 'bignumber.js';

const START_BLOCK = 2176086;
const USD_MARK_TO_MARKET_ADDRESS = '0x1F4947Cd5A5c058DD5EA6Fd1CCd5c311aDa9E6Fb';
const USDplus = '0xb79dd08ea68a908a97220c76d19a6aa9cbde4376';
const DAI_ARK_TO_MARKET_ADDRESS = '0x7a62315519A39d562c1E49EB35b300d2E6742f86';
const DAI = '0x50c5725949a6f0c72e6c4a641f24049a917db0cb';
const ABI = [
  {
    inputs: [],
    name: 'totalNetAssets',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  const [daiBalance, usdcBalance] = await Promise.all([
    util.executeCall(
      DAI_ARK_TO_MARKET_ADDRESS,
      ABI,
      'totalNetAssets',
      [],
      block,
      chain,
      web3,
    ),
    util.executeCall(
      USD_MARK_TO_MARKET_ADDRESS,
      ABI,
      'totalNetAssets',
      [],
      block,
      chain,
      web3,
    ),
  ]);
  balances[USDplus] = new BigNumber(usdcBalance).toFixed();
  balances[DAI] = new BigNumber(daiBalance).toFixed();

  return { balances };
}
export { tvl };
