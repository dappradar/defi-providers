import ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const MARKET = '0xBabeE6d5F6EDD301B5Fae591a0D61AB702b359d0';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;

  if (block < 12822556) {
    return {};
  }

  const balances = {
    [USDC]: await util.executeCall(
      MARKET,
      ABI,
      'currentTVL',
      [],
      block,
      chain,
      web3,
    ),
  };
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
