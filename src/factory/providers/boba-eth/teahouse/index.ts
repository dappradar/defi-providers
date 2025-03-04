import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';
import ABI from './abi.json';
import BigNumber from 'bignumber.js';

const VAULT_API_URL = process.env.TEAHOUSE_VAULT_API_URL;

interface VaultAddresses {
  pairVaults: string[];
  portVaults: string[];
}

async function getVaultContractAddresses(
  chain: string,
  provider: string,
): Promise<VaultAddresses> {
  try {
    const response = await axios.get(VAULT_API_URL);
    const vaults = response.data.vaults || [];

    const apiChainName = chain === 'boba-eth' ? 'boba' : chain;

    const pairVaults: string[] = [];
    const portVaults: string[] = [];

    vaults.forEach((vault) => {
      if (
        vault.chain === apiChainName &&
        vault.isDeFi === true &&
        vault.isActive === true
      ) {
        if (vault.type && vault.type.toLowerCase() === 'v3pair') {
          if (vault.share && vault.share.address) {
            pairVaults.push(vault.share.address);
          }
        } else if (vault.type && vault.type.toLowerCase() === 'v3port') {
          if (vault.share && vault.share.address) {
            portVaults.push(vault.share.address);
          }
        }
      }
    });

    const vaultAddresses = { pairVaults, portVaults };

    await basicUtil.saveIntoCache(
      vaultAddresses,
      'vaultAddresses.json',
      chain,
      provider,
    );

    return vaultAddresses;
  } catch (error) {
    console.log('Error fetching vault addresses:', error);
    try {
      return await basicUtil.readFromCache(
        'vaultAddresses.json',
        chain,
        provider,
      );
    } catch {
      return { pairVaults: [], portVaults: [] };
    }
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { chain, provider, web3, block } = params;
  const balances = {};

  const { pairVaults, portVaults } = await getVaultContractAddresses(
    chain,
    provider,
  );

  if (pairVaults.length === 0 && portVaults.length === 0) {
    console.log('No vaults found for chain:', chain);
    return { balances };
  }

  try {
    if (pairVaults.length > 0) {
      const tokens0 = await Promise.all(
        pairVaults.map(async (vaultAddress) => {
          try {
            return await util.executeCall(
              vaultAddress,
              ABI,
              'assetToken0',
              [],
              block,
              chain,
              web3,
            );
          } catch (error) {
            console.log(
              `Error getting token0 for vault ${vaultAddress}:`,
              error,
            );
            return null;
          }
        }),
      );

      const tokens1 = await Promise.all(
        pairVaults.map(async (vaultAddress) => {
          try {
            return await util.executeCall(
              vaultAddress,
              ABI,
              'assetToken1',
              [],
              block,
              chain,
              web3,
            );
          } catch (error) {
            console.log(
              `Error getting token1 for vault ${vaultAddress}:`,
              error,
            );
            return null;
          }
        }),
      );

      const vaultBalances = await Promise.all(
        pairVaults.map(async (vaultAddress) => {
          try {
            return await util.executeCall(
              vaultAddress,
              ABI,
              'vaultAllUnderlyingAssets',
              [],
              block,
              chain,
              web3,
            );
          } catch (error) {
            console.log(
              `Error getting balances for vault ${vaultAddress}:`,
              error,
            );
            return null;
          }
        }),
      );

      for (let i = 0; i < pairVaults.length; i++) {
        if (tokens0[i] && tokens1[i] && vaultBalances[i]) {
          const balance0 = vaultBalances[i].amount0 || '0';
          const balance1 = vaultBalances[i].amount1 || '0';

          if (!balances[tokens0[i]]) {
            balances[tokens0[i]] = new BigNumber(0);
          }
          balances[tokens0[i]] = balances[tokens0[i]].plus(balance0);

          if (!balances[tokens1[i]]) {
            balances[tokens1[i]] = new BigNumber(0);
          }
          balances[tokens1[i]] = balances[tokens1[i]].plus(balance1);
        }
      }
    }

    if (portVaults.length > 0) {
      const assetsArrays = await Promise.all(
        portVaults.map(async (vaultAddress) => {
          try {
            return await util.executeCall(
              vaultAddress,
              ABI,
              'getAssets',
              [],
              block,
              chain,
              web3,
            );
          } catch (error) {
            console.log(
              `Error getting assets for vault ${vaultAddress}:`,
              error,
            );
            return [];
          }
        }),
      );

      const balancesArrays = await Promise.all(
        portVaults.map(async (vaultAddress) => {
          try {
            return await util.executeCall(
              vaultAddress,
              ABI,
              'getAssetsBalance',
              [],
              block,
              chain,
              web3,
            );
          } catch (error) {
            console.log(
              `Error getting balances for vault ${vaultAddress}:`,
              error,
            );
            return [];
          }
        }),
      );

      for (let i = 0; i < portVaults.length; i++) {
        const assets = assetsArrays[i];
        const assetBalances = balancesArrays[i];

        if (Array.isArray(assets) && Array.isArray(assetBalances)) {
          const assetTypes = await Promise.all(
            assets.map(async (asset) => {
              try {
                return await util.executeCall(
                  portVaults[i],
                  ABI,
                  'assetType',
                  [asset],
                  block,
                  chain,
                  web3,
                );
              } catch (error) {
                console.log(`Error getting asset type for ${asset}:`, error);
                return null;
              }
            }),
          );

          for (let j = 0; j < assets.length; j++) {
            const assetType = assetTypes[j];

            if (assetType === '4') {
              try {
                const underlying = await util.executeCall(
                  assets[j],
                  ABI,
                  'underlyingAsset',
                  [],
                  block,
                  chain,
                  web3,
                );
                if (!balances[underlying]) {
                  balances[underlying] = new BigNumber(0);
                }
                balances[underlying] = balances[underlying].plus(
                  assetBalances[j],
                );
              } catch (error) {
                console.log(
                  `Error getting underlying asset for ${assets[j]}:`,
                  error,
                );
              }
            } else if (assetType !== '3') {
              if (!balances[assets[j]]) {
                balances[assets[j]] = new BigNumber(0);
              }
              balances[assets[j]] = balances[assets[j]].plus(assetBalances[j]);
            }
          }
        }
      }
    }
  } catch (error) {
    console.log('Error processing vaults:', error);
  }

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
