import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import {
  ITvlParams,
  ITvlBalancesReturn,
  ITvlBalancesPoolBalancesReturn,
} from '../../../../interfaces/ITvl';

const POOL = '0xcEf6C2e20898C2604886b888552CA6CcF66933B0';
const TOKENS = [
  '0x4988a896b1227218e4A686fdE5EabdcAbd91571f',
  '0xB12BFcA5A55806AaF64E99521918A4bf0fC40802',
];

async function tvl(
  params: ITvlParams,
): Promise<
  ITvlBalancesReturn | ITvlBalancesPoolBalancesReturn | Record<string, never>
> {
  const { block, chain } = params;

  if (block < 56525135) {
    return {};
  }

  const tokenBalances = await util.getTokenBalances(POOL, TOKENS, block, chain);

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
