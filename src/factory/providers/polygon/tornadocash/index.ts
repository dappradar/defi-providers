import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const CONTRACTS = [
  '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD', // 100 MATIC
  '0xdf231d99Ff8b6c6CBF4E9B9a945CBAcEF9339178', // 1 000 MATIC
  '0xaf4c0B70B2Ea9FB7487C7CbB37aDa259579fe040', // 10 000 MATIC
  '0xa5C2254e4253490C54cef0a4347fddb8f75A4998', // 100 000 MATIC
];
const START_BLOCK = 16258013;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
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
  return { balances };
}

export { tvl };
