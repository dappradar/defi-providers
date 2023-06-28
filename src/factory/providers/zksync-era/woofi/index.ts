import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 1466617;
const WOOPPV2_ADDRESS = '0x42ED123EB5266A5B8E2B54B2C76180CCF5e72FEe';
const USDC_ADDRESS = '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4';
const WETH_ADDRESS = '0x5aea5775959fbc2557cc8789bc1bf90a239d9a91';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  const tokenBalances = await util.getTokenBalances(
    WOOPPV2_ADDRESS,
    [USDC_ADDRESS, WETH_ADDRESS],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
