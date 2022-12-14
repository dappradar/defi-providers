import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

/*==================================================
    Settings
    ==================================================*/

const POOL = '0x70e8C8139d1ceF162D5ba3B286380EB5913098c4';
const TOKENS = [
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // USDC
];

/*==================================================
    TVL
    ==================================================*/

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < 13902436) {
    return {};
  }

  const tokenBalances = await util.getTokenBalances(
    POOL,
    TOKENS,
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

/*==================================================
    Exports
    ==================================================*/

export { tvl };
