import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 507512;
const TOMO = '0x9e813d7661d7b56cbcd3f73e958039b208925ef8';
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }
  const balances = {
    ['0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f']: await web3.eth.getBalance(
      TOMO,
      block,
    ),
  };

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
