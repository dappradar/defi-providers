import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';
import basicUtil from '../../../../util/basicUtil';

const ABI = [
  {
    inputs: [],
    name: 'getPoolTokenList',
    outputs: [
      {
        internalType: 'address[]',
        name: '',
        type: 'address[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];
const START_BLOCK = 724058;
const SWAP_CONTRACT_ADDRESSES = [
  '0x84c18204c30da662562b7a2c79397c9e05f942f0',
  '0x2a98158166be71d21dd97e248ba670211df9a73c',
];
const OC_WETH_ADDRESS = '0x9bd8c192a74566546f8998a29c1e0ca10a47c359';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  const tokens = await util.executeCallOfMultiTargets(
    SWAP_CONTRACT_ADDRESSES,
    ABI,
    'getPoolTokenList',
    [],
    block,
    chain,
    web3,
  );

  const tokenBalances = await Promise.all([
    util.getTokenBalances(
      SWAP_CONTRACT_ADDRESSES[0],
      tokens[0],
      block,
      chain,
      web3,
    ),
    util.getTokenBalances(
      SWAP_CONTRACT_ADDRESSES[1],
      tokens[1],
      block,
      chain,
      web3,
    ),
  ]);

  formatter.sumMultiBalanceOf(balances, tokenBalances[0], chain, provider);
  formatter.sumMultiBalanceOf(balances, tokenBalances[1], chain, provider);

  if (balances[OC_WETH_ADDRESS]) {
    balances[basicUtil.getWmainAddress(chain)] = BigNumber(
      balances[basicUtil.getWmainAddress(chain)] || 0,
    )
      .plus(balances[OC_WETH_ADDRESS])
      .toFixed();
    delete balances[OC_WETH_ADDRESS];
  }

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
