import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';

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
const START_BLOCK = 724058;
const MARK_TO_MARKET_ADDRESS = '0x240aad990FFc5F04F11593fF4dCF1fF714d6fc80';
const USDC_ADDRESS = '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  const usdcBalance = await util.executeCall(
    MARK_TO_MARKET_ADDRESS,
    ABI,
    'totalNetAssets',
    [],
    block,
    chain,
    web3,
  );

  balances[USDC_ADDRESS] = new BigNumber(usdcBalance).toFixed();

  return { balances };
}

export { tvl };
