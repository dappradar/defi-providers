import ERC20_ABI from '../../../../constants/abi/erc20.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const ETH_POOL = '0x878F15ffC8b894A1BA7647c7176E4C01f74e140b';
const BTC_POOL = '0x20DD9e22d22dd0a6ef74a520cb08303B5faD5dE7';
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const WBTC_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11029500) {
    return {};
  }

  const balances = {};

  try {
    const contract = new web3.eth.Contract(ERC20_ABI, WBTC_ADDRESS);
    const balance = await contract.methods
      .balanceOf(BTC_POOL)
      .call(null, block);
    balances[WBTC_ADDRESS] = balance;
  } catch {}

  try {
    const balance = await web3.eth.getBalance(ETH_POOL, block);
    balances[WETH_ADDRESS] = balance;
  } catch {}
  return { balances };
}

export { tvl };
