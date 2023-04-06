import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const START_BLOCK = 2100000;

const FACTORY_ADDRESS = '0xd590cC180601AEcD6eeADD9B7f2B7611519544f4';
const MMF_TOKEN = '0x97749c9B61F878a880DfE312d2594AE07AEd7656';
const MASTER_CHEF = '0x6bE34986Fdd1A91e4634eb6b9F8017439b7b5EDc';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  const balanceResults = await util.getTokenBalances(
    MASTER_CHEF,
    [MMF_TOKEN],
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, balanceResults, chain, provider);
  formatter.convertBalancesToFixed(balances);

  return { balances, poolBalances };
}

export { tvl };
