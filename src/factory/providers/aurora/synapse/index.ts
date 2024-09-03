import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 56525135;
const POOL = '0xcEf6C2e20898C2604886b888552CA6CcF66933B0';
const TOKENS = [
  '0x4988a896b1227218e4A686fdE5EabdcAbd91571f',
  '0xB12BFcA5A55806AaF64E99521918A4bf0fC40802',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const tokenBalances = await util.getTokenBalances(
    POOL,
    TOKENS,
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
