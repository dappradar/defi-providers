import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';

const START_BLOCK = 19265317;
const MOONLANDER = '0xE6F6351fb66f3a35313fEEFF9116698665FBEeC9';

const ABI = [
  {
    constant: true,
    inputs: [],
    name: 'totalValue',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'tokenAddress', type: 'address' },
          { internalType: 'int256', name: 'value', type: 'int256' },
          { internalType: 'uint8', name: 'decimals', type: 'uint8' },
          { internalType: 'int256', name: 'valueUsd', type: 'int256' },
          { internalType: 'uint16', name: 'targetWeight', type: 'uint16' },
          { internalType: 'uint16', name: 'feeBasisPoints', type: 'uint16' },
          { internalType: 'uint16', name: 'taxBasisPoints', type: 'uint16' },
          { internalType: 'bool', name: 'dynamicFee', type: 'bool' },
        ],
        internalType: 'tuple[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const balances = {};

  try {
    const totalValueInfo = await util.executeCall(
      MOONLANDER,
      ABI,
      'totalValue',
      [],
      block,
      chain,
      web3,
    );

    if (totalValueInfo && totalValueInfo.length > 0) {
      const tokenAddresses = totalValueInfo
        .map((item) => {
          if (typeof item === 'string') {
            const parts = item.split(',');
            return parts[0];
          }
          return item.tokenAddress;
        })
        .filter(Boolean);

      if (tokenAddresses.length > 0) {
        const tokenBalances = await util.getTokenBalances(
          MOONLANDER,
          tokenAddresses,
          block,
          chain,
          web3,
        );

        formatter.sumMultiBalanceOf(balances, tokenBalances);
      }
    }
  } catch (error) {
    console.log('Error getting moonlander TVL:', error);
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
