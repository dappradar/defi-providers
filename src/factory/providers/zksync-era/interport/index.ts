import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import VAULT_ABI from './vaultAbi.json';

const START_BLOCK = 3242317;
const VAULT_ADDRESS = '0xc724832c5ed81599ae3e4ebc0ec4f87a285b5838';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  const assetAddress = await util.executeCall(
    VAULT_ADDRESS,
    VAULT_ABI,
    'asset',
    [],
    block,
    chain,
    web3,
  );

  const vaultBalance = await util.getTokenBalances(
    VAULT_ADDRESS,
    [assetAddress],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, vaultBalance);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
