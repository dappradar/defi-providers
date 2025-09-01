import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import { IBalances } from '../../interfaces/ITvl';
import util from '../blockchainUtil';
import formatter from '../formatter';
import ERC4626_VAULT_ABI from '../../constants/abi/erc4626Vault.json';

async function getTvl(
  vaultAddresses: string[],
  block: number,
  chain: string,
  provider: string,
  web3: Web3,
): Promise<IBalances> {
  const assetResults = await util.executeCallOfMultiTargets(
    vaultAddresses,
    ERC4626_VAULT_ABI,
    'asset',
    [],
    block,
    chain,
    web3,
  );

  const totalAssetsResults = await util.executeCallOfMultiTargets(
    vaultAddresses,
    ERC4626_VAULT_ABI,
    'totalAssets',
    [],
    block,
    chain,
    web3,
  );

  const tokenBalances = [];
  vaultAddresses.forEach((vault, index) => {
    const asset = assetResults[index];
    const totalAssets = totalAssetsResults[index];

    if (asset && totalAssets && BigNumber(totalAssets).isGreaterThan(0)) {
      tokenBalances.push({
        token: asset.toLowerCase(),
        balance: BigNumber(totalAssets),
      });
    }
  });

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances);
  return balances;
}

export default {
  getTvl,
};
