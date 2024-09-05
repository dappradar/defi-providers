import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const START_BLOCK = 20529225;
const FACTORY_ADDRESS = '0x29a56a1b8214D9Cf7c5561811750D5cBDb45CC8e';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  const proxyListLength = await util.executeCall(
    FACTORY_ADDRESS,
    [
      {
        inputs: [],
        name: 'getProxyListLength',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    'getProxyListLength',
    [],
    block,
    chain,
    web3,
  );

  const proxyList = await util.executeMultiCallsOfTarget(
    FACTORY_ADDRESS,
    [
      {
        inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        name: 'proxyList',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    'proxyList',
    Array.from({ length: proxyListLength }, (v, i) => [i]),
    block,
    chain,
    web3,
  );

  const assets = await util.executeCallOfMultiTargets(
    proxyList,
    [
      {
        inputs: [],
        name: 'asset',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    'asset',
    [],
    block,
    chain,
    web3,
  );

  const tokenBalances = await util.getTokenBalancesOfHolders(
    proxyList,
    assets,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
