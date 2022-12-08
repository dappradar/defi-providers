import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import {
  ITvlParams,
  ITvlBalancesReturn,
  ITvlBalancesPoolBalancesReturn,
} from '../../../../interfaces/ITvl';

const START_BLOCK = 56781094;
const EMPYR = '0xe9f226a228eb58d408fdb94c3ed5a18af6968fe1';
const USDC = '0xb12bfca5a55806aaf64e99521918a4bf0fc40802';
const EMPYR_USDC = '0x6e46c69fe35ef5bb78d7f35d92645c74245a6567';
const STAKING_CONTRACT = '0xd080cbc2885c64510923ac6f5c8896011f86a6af';
const TREASURY = '0x4606f4e6d43d501b86fc583f44ae27097a1f9ea7';

async function tvl(
  params: ITvlParams,
): Promise<
  ITvlBalancesReturn | ITvlBalancesPoolBalancesReturn | Record<string, never>
> {
  const { block, chain } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const tokenBalances = await util.getTokenBalancesOfHolders(
    [STAKING_CONTRACT, TREASURY, TREASURY],
    [EMPYR, USDC, EMPYR_USDC],
    block,
    chain,
  );

  const empyrUsdcUnderlyingBalance = await util.getUnderlyingBalance(
    EMPYR_USDC,
    tokenBalances.find((t) => t.token === EMPYR_USDC).balance,
    block,
    chain,
  );

  formatter.sumMultiBalanceOf(balances, empyrUsdcUnderlyingBalance);
  formatter.sumMultiBalanceOf(
    balances,
    tokenBalances.filter((t) => t.token !== EMPYR_USDC),
  );

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
