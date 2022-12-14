import BigNumber from 'bignumber.js';
import POOL_ABI from './abi.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOL_ADDRESS = '0xFfc7780C34B450d917d557E728f033033CB4fA8C';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 1462819) {
    return {};
  }

  const contract = new web3.eth.Contract(POOL_ABI, POOL_ADDRESS);
  const balance = await contract.methods.getTotalPooledKSM().call(null, block);
  const balances = {
    coingecko_kusama: BigNumber(balance).div(1e12).toFixed(),
  };
  return { balances };
}

export { tvl };
