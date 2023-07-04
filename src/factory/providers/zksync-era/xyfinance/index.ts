import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 2210653;
const ETH_HOLDER_ADDRESS = '0x935283a00fbf8e40fd2f8c432a488f6addc8db67';
const USDC_HOLDER_ADDRESS = '0x75167284361c8d61be7e4402f4953e2b112233cb';
const USDC_ADDRESS = '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  const usdcBalance = await util.getTokenBalancesOfHolders(
    [USDC_HOLDER_ADDRESS],
    [USDC_ADDRESS],
    block,
    chain,
    web3,
  );

  const ethBalance = await util.getBalancesOfHolders(
    [ETH_HOLDER_ADDRESS],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, usdcBalance);
  formatter.sumMultiBalanceOf(balances, ethBalance);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
