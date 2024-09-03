import util from '../blockchainUtil';
import BigNumber from 'bignumber.js';

const CONFIG = {
  ethereum: {
    pools: [
      '0x77b2043768d28E9C9aB44E1aBfC95944bcE57931',
      '0xc026395860Db2d07ee33e05fE50ed7bD583189C7',
      '0x933597a323Eb81cAe705C5bC29985172fd5A3973',
      '0xcDafB1b2dB43f366E48e6F614b8DCCBFeeFEEcD3',
      '0x268Ca24DAefF1FaC2ed883c598200CcbB79E931D',
    ],
  },
  avalanche: {
    pools: [
      '0x5634c4a5FEd09819E3c46D86A965Dd9447d86e47',
      '0x12dC9256Acc9895B076f6638D628382881e62CeE',
    ],
  },
  optimism: {
    pools: [
      '0xe8CDF27AcD73a434D661C84887215F7598e7d0d3',
      '0xcE8CcA271Ebc0533920C83d39F417ED6A0abB7D0',
      '0x19cFCE47eD54a88614648DC3f19A5980097007dD',
    ],
  },
  polygon: {
    pools: [
      '0x9Aa02D4Fae7F58b8E8f34c66E756cC734DAc7fe4',
      '0xd47b03ee6d86Cf251ee7860FB2ACf9f91B9fD4d7',
    ],
  },
  arbitrum: {
    pools: [
      '0xA45B5130f36CDcA45667738e2a258AB09f4A5f7F',
      '0xe8CDF27AcD73a434D661C84887215F7598e7d0d3',
      '0xcE8CcA271Ebc0533920C83d39F417ED6A0abB7D0',
    ],
  },
  base: {
    pools: [
      '0xdc181Bd607330aeeBEF6ea62e03e5e1Fb4B6F7C7',
      '0x27a16dc786820B16E5c9028b75B99F6f604b5d26',
    ],
  },
  linea: {
    pools: ['0x81F6138153d473E8c5EcebD3DC8Cd4903506B075'],
  },
  bsc: {
    pools: ['0x138EB30f73BC423c6455C53df6D89CB01d9eBc63'],
  },
  aurora: {
    pools: ['0x81F6138153d473E8c5EcebD3DC8Cd4903506B075'],
  },
};

async function getV2Tvl(
  chain: string,
  block: number,
  web3: any,
): Promise<{ token: string; balance: BigNumber }[]> {
  const tokens = await util.executeCallOfMultiTargets(
    CONFIG[chain].pools,
    [
      {
        inputs: [],
        name: 'token',
        outputs: [
          {
            internalType: 'address',
            name: '',
            type: 'address',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    'token',
    [],
    block,
    chain,
    web3,
  );

  const nativeCoinHolders = CONFIG[chain].pools.filter(
    (_, index) => tokens[index] === util.ZERO_ADDRESS,
  );

  let nativeCoinBalances = [];
  if (nativeCoinHolders.length > 0) {
    nativeCoinBalances = await util.getBalancesOfHolders(
      nativeCoinHolders,
      block,
      chain,
      web3,
    );
  }

  const tokenBalances = await util.getTokenBalancesOfHolders(
    CONFIG[chain].pools,
    tokens,
    block,
    chain,
    web3,
  );

  return [...nativeCoinBalances, ...tokenBalances];
}

export default {
  getV2Tvl,
};
