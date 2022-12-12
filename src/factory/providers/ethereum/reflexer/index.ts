import ERC20_ABI from '../../../../constants/abi/erc20.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const ETH_COLLATERAL_JOIN = '0x2d3cd7b81c93f188f3cb8ad87c8acc73d6226e3a';
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11838442) {
    return {};
  }

  const contract = new web3.eth.Contract(ERC20_ABI, WETH_ADDRESS);
  const balance = await contract.methods
    .balanceOf(ETH_COLLATERAL_JOIN)
    .call(null, block);

  const balances = {
    [WETH_ADDRESS]: balance,
  };
  return { balances };
}

export { tvl };
