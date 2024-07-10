import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';

const START_BLOCK = 1466617;
const WOOPPV2_ADDRESS = '0xE656d70bc3550e3EEE9dE7dC79367A44Fd13d975';
const USDC_ADDRESS = '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  const tokenBalances = await util.getTokenBalances(
    WOOPPV2_ADDRESS,
    [
      USDC_ADDRESS,
      basicUtil.getWmainAddress(chain),
      '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4',
    ],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
