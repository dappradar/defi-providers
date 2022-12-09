import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 10674372;
const IMMO = '0xe685d21b7b0fc7a248a6a8e03b8db22d013aa2ee';
const CUSD = '0x918146359264c492bd6934071c6bd31c854edbc3';
const IMMO_CUSD = '0x7d63809ebf83ef54c7ce8ded3591d4e8fc2102ee';
const STAKING_CONTRACT = '0xa02f4e8de9a226e8f2f2fe27b9b207fc85cfeed2';
const TREASURY = '0xe2adcd126b4275cd75e72ff7ddc8cf7e43fc13d4';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const tokenBalances = await util.getTokenBalancesOfHolders(
    [STAKING_CONTRACT, TREASURY, TREASURY],
    [IMMO, CUSD, IMMO_CUSD],
    block,
    chain,
    web3,
  );

  const immoCusdUnderlyingBalance = await util.getUnderlyingBalance(
    IMMO_CUSD,
    tokenBalances.find((t) => t.token === IMMO_CUSD).balance,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, immoCusdUnderlyingBalance);
  formatter.sumMultiBalanceOf(
    balances,
    tokenBalances.filter((t) => t.token !== IMMO_CUSD),
  );

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
