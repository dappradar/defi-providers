import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOL = '0x55Be05ecC1c417B16163b000CB71DcE8526a5D06';
const TOKENS = [
  '0xB12BFcA5A55806AaF64E99521918A4bf0fC40802', // USDC
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain } = params;

  if (block < 58731719) {
    return {};
  }

  const tokenBalances = await util.getTokenBalances(POOL, TOKENS, block, chain);

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
