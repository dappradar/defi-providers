import POOL_ABI from './abi.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOL_ADDRESS = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11473216) {
    return {};
  }

  const contract = new web3.eth.Contract(POOL_ABI, POOL_ADDRESS);
  const balance = await contract.methods
    .getTotalPooledEther()
    .call(null, block);
  const balances = {
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': balance,
  };
  return { balances };
}

export { tvl };
