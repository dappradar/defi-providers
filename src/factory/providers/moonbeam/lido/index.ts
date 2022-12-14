import BigNumber from 'bignumber.js';
import POOL_ABI from './abi.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOL_ADDRESS = '0xfa36fe1da08c89ec72ea1f0143a35bfd5daea108';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 906643) {
    return {};
  }

  const contract = new web3.eth.Contract(POOL_ABI, POOL_ADDRESS);
  const balance = await contract.methods.getTotalPooledKSM().call(null, block);
  const balances = {
    coingecko_polkadot: BigNumber(balance).div(1e10).toFixed(),
  };
  return { balances };
}

export { tvl };
