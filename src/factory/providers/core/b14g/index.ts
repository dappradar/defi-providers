import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import blockchainUtil from '../../../../util/blockchainUtil';
import rewardReceivers from './rewardReceivers.json';
import BigNumber from 'bignumber.js';

const CORE_ADDRESS = '0x191e94fa59739e188dce837f7f6978d84727ad01';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = {};

  const coreBalances = await blockchainUtil.executeCallOfMultiTargets(
    rewardReceivers,
    [
      {
        inputs: [],
        name: 'totalCoreStake',
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
    ],
    'totalCoreStake',
    [],
    block,
    chain,
    web3,
  );

  balances[CORE_ADDRESS] = coreBalances.reduce(
    (acc, balance) => acc.plus(balance || '0'),
    new BigNumber(0),
  );

  const totalStaked = await blockchainUtil.executeCall(
    '0xee21ab613d30330823D35Cf91A84cE964808B83F',
    [
      {
        inputs: [],
        name: 'totalStaked',
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
    ],
    'totalStaked',
    [],
    block,
    chain,
    web3,
  );
  balances[CORE_ADDRESS] = balances[CORE_ADDRESS].plus(totalStaked);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
