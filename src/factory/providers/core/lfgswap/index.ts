import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const STAKING_CONTRACT = [
  '0x00801Df22566E6F1b7Eb2DCaa2c794ca6daD3D0A',
  '0xcF17abb2CeA7e96eD1E35E0F3FAC919cFECad2F3',
];

const START_BLOCK = 1153248;
const FACTORY_ADDRESS = '0xa1add165aed06d26fc1110b153ae17a5a5ae389e';
const LFG_Token = '0xf7a0b80681ec935d6dd9f3af9826e68b99897d6d';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
    false,
    false,
  );

  const stakedBalance = await util.getTokenBalancesOfEachHolder(
    STAKING_CONTRACT,
    [LFG_Token],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, stakedBalance);
  formatter.convertBalancesToFixed(balances);
  return { balances, poolBalances };
}

export { tvl };
