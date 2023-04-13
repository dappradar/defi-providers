import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import ERC20_ABI from '../../../../constants/abi/erc20.json';

const START_BLOCK = 2100000;

const BCRO = '0xebaceb7f193955b946cc5dd8f8724a80671a1f2f';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const totalSupply = await util.executeCall(
    BCRO,
    ERC20_ABI,
    'totalSupply',
    [],
    block,
    chain,
    web3,
  );
  return {
    balances: {
      [BCRO]: totalSupply,
    },
  };
}

export { tvl };
