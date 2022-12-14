import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const CONTRACTS = [
  '0x84443CFd09A48AF6eF360C6976C5392aC5023a1F', // 0.1 BNB
  '0xd47438C816c9E7f2E2888E060936a499Af9582b3', // 1 BNB
  '0x330bdFADE01eE9bF63C209Ee33102DD334618e0a', // 10 BNB
  '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD', // 100 BNB
];
const START_BLOCK = 8159279;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const bnbBalances = await util.getBalancesOfHolders(
    CONTRACTS,
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, bnbBalances);

  formatter.convertBalancesToFixed(balances);
  //
  return { balances };
}

export { tvl };
