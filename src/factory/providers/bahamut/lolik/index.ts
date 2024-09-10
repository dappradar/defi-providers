import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const START_BLOCK = 1338123;

const STAKING_CONTRACT = '0x780Fb5AcA83F2e3F57EE18cc3094988Ef49D8c3d';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const balance = await util.executeCall(
    STAKING_CONTRACT,
    [
      {
        constant: true,
        inputs: [],
        name: 'getTotalPooledFtn',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
    ],
    'getTotalPooledFtn',
    [],
    block,
    chain,
    web3,
  );
  return {
    balances: {
      ['ftn']: balance,
    },
  };
}

export { tvl };
