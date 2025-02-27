import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 23522674;
const STAKING_ADDRESSES = [
  '0x0A3AC95445F3e02cC80267f02B9669ed75b71043',
  '0xC948622856a40Efd50d74BA6e3624FE7100A95Ef',
  '0x121E257f4A6fa763012eF0b6b6f68905F6D4b721',
  '0xc81632E77Ea7262137EA815DC8BA7a47A5a01ab1',
  '0x5a54EC1e6DA36f19a806A9168fD4270fEf697354',
  '0x8CeB404D939c293ad070A5B33fc197df3aF1AbB7', // single
  '0xDD71D03d70848F79a1C6df6eB0f6623236BBD85B', // lp
];

const TOKEN_ADDRESSES = [
  '0x5f588EfAf8eB57e3837486e834fC5a4E07768D98',
  '0xE01eDA650632986B2E5B8167F629D7C7c759D4FD',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const proxyBalance = await util.getTokenBalancesOfEachHolder(
    STAKING_ADDRESSES,
    TOKEN_ADDRESSES,
    block,
    chain,
    web3,
  );

  // console.log('proxyBalanceproxyBalance', proxyBalance);
  const balances = {};
  formatter.sumMultiBalanceOf(balances, proxyBalance);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
