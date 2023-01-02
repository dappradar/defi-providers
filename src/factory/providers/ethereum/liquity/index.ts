import abi from './abi.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { log } from '../../../../util/logger/logger';

const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const TROVE_MANAGER_ADDRESS = '0xA39739EF8b0231DbFA0DcdA07d7e29faAbCf4bb2';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 12178557) {
    return {};
  }

  const balances = {};

  try {
    const managerContract = new web3.eth.Contract(abi, TROVE_MANAGER_ADDRESS);
    const troveEthTvl = await managerContract.methods
      .getEntireSystemColl()
      .call(null, block);
    balances[WETH_ADDRESS] = troveEthTvl;
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tvl of ethereum/liquity`,
      endpoint: 'tvl',
    });
  }
  return { balances };
}

export { tvl };
