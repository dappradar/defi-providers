import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import POOL_ABI from './pool_abi.json';
import VAULT_LIB_ABI from './vault_lib_abi.json';

const POOL_ADDRESS = '0xcafea112db32436c2390f5ec988f3adb96870627';
const VAULT_PROXY_ADDRESS = '0x27f23c710dd3d878fe9393d93465fed1302f2ebd';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 7815747) {
    return {};
  }

  const balances = {};

  const poolAssets = await util
    .executeCall(POOL_ADDRESS, POOL_ABI, 'getAssets', [], block, chain, web3)
    .then((assets: string[]) =>
      assets.map((asset) => asset.split(',')[0].toLowerCase()),
    );

  const vaultAssets = await util.executeCall(
    VAULT_PROXY_ADDRESS,
    VAULT_LIB_ABI,
    'getTrackedAssets',
    [],
    block,
    chain,
    web3,
  );

  const poolBalances = await util.getTokenBalances(
    POOL_ADDRESS,
    poolAssets,
    block,
    chain,
    web3,
  );

  const vaultBalances = await util.getTokenBalances(
    VAULT_PROXY_ADDRESS,
    vaultAssets,
    block,
    chain,
    web3,
  );

  const ethBalances = await util.getBalancesOfHolders(
    [POOL_ADDRESS, VAULT_PROXY_ADDRESS],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, poolBalances);
  formatter.sumMultiBalanceOf(balances, vaultBalances);
  formatter.sumMultiBalanceOf(balances, ethBalances, chain, provider);

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
