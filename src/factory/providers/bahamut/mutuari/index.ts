import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';

const START_BLOCK = 2799294;

const CONTRACT_ADDRESS = '0x831fc32221924f8a6d47251327ef67ebcc5cd6dc';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const pool = await util.executeCall(
    CONTRACT_ADDRESS,
    [
      {
        constant: true,
        inputs: [],
        name: 'mutuariPool',
        outputs: [
          {
            name: '',
            type: 'address',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
    ],
    'mutuariPool',
    [],
    block,
    chain,
    web3,
  );

  const tokens = await util.executeCall(
    pool,
    [
      {
        constant: true,
        inputs: [],
        name: 'getReserves',
        outputs: [
          {
            name: '',
            type: 'address[]',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
    ],
    'getReserves',
    [],
    block,
    chain,
    web3,
  );

  const balances = {};
  const balanceResults = await util.getTokenBalances(
    pool,
    tokens,
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, balanceResults, chain, provider);
  formatter.convertBalancesToFixed(balances);

  return {
    balances,
  };
}

export { tvl };
