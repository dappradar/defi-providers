import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import { WMAIN_ADDRESS } from '../../../../constants/contracts.json';

const START_BLOCK = 926110;
const FACTORY_ADDRESS = '0xe840Bb03fE58540841e6eBee94264d5317B88866';
const BLOCK_LIMIT = 10000;

// ABI definitions
const VAULT_ABI = [
  {
    inputs: [],
    name: 'stTotalAmount',
    outputs: [
      {
        internalType: 'uint256',
        name: 'balance',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'asset',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

const DECIMALS_ABI = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

// Linea WETH_1 address to map to null (ETH)
const LINEA_WETH = '0x0000000000000000000000000000000000000001';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  let cache: {
    start: number;
    vaults: string[];
  } = { start: START_BLOCK, vaults: [] };

  try {
    const loadedCache = await basicUtil.readFromCache(
      'cache.json',
      chain,
      provider,
    );
    cache = {
      start: loadedCache.start || START_BLOCK,
      vaults: loadedCache.vaults || [],
    };
  } catch {}

  // Get AddBToken event logs to find vault addresses
  for (
    let i = Math.max(cache.start, START_BLOCK);
    i < block;
    i += BLOCK_LIMIT
  ) {
    const logs = await util.getLogs(
      i,
      Math.min(i + BLOCK_LIMIT - 1, block),
      '0xf3cb923bb200cef027d498d9464f8d462acaee2c8189f9c44a882aa09f44ec00',
      FACTORY_ADDRESS,
      web3,
    );

    logs.output.forEach((log) => {
      // Extract vault address from log data
      // Log data structure: bToken (32 bytes) + vault (32 bytes) + oracleId (32 bytes) + collateralFactor (32 bytes)
      // Each address is padded to 32 bytes, so actual address starts 24 chars in (12 bytes of padding)
      // vault starts at position 64 (second 32-byte slot) + 24 chars padding = position 88
      const vaultAddress = `0x${log.data.substring(90, 130)}`;

      if (!cache.vaults.includes(vaultAddress)) {
        cache.vaults.push(vaultAddress);
      }
    });

    cache.start = Math.min(i + BLOCK_LIMIT, block);
    basicUtil.saveIntoCache(cache, 'cache.json', chain, provider);
  }

  if (cache.vaults.length > 0) {
    // Get stTotalAmount for each vault
    const stTotalAmounts = await util.executeCallOfMultiTargets(
      cache.vaults,
      VAULT_ABI,
      'stTotalAmount',
      [],
      block,
      chain,
      web3,
    );

    // Get underlying asset for each vault
    let assets = await util.executeCallOfMultiTargets(
      cache.vaults,
      VAULT_ABI,
      'asset',
      [],
      block,
      chain,
      web3,
    );

    // Map WETH_1 to null address (ETH)
    assets = assets.map((asset) =>
      asset && asset.toLowerCase() === LINEA_WETH.toLowerCase()
        ? WMAIN_ADDRESS[chain]
        : asset,
    );

    // Get decimals for non-null assets
    const nonNullAssets = assets.filter((asset) => asset !== null);
    const decimals = await util.executeCallOfMultiTargets(
      nonNullAssets,
      DECIMALS_ABI,
      'decimals',
      [],
      block,
      chain,
      web3,
    );

    // Create decimal mapping
    const decimalMap = {};
    let decimalIndex = 0;
    assets.forEach((asset, index) => {
      if (asset !== null) {
        decimalMap[index] = decimals[decimalIndex] || 18;
        decimalIndex++;
      } else {
        decimalMap[index] = 18; // ETH has 18 decimals
      }
    });

    // Process balances
    for (let i = 0; i < cache.vaults.length; i++) {
      const stTotalAmount = stTotalAmounts[i];
      const asset = assets[i];
      const assetDecimals = decimalMap[i];

      if (stTotalAmount && stTotalAmount !== '0') {
        // Apply decimal adjustment: stTotalAmount is in 18 decimals, adjust to asset decimals
        const adjustedBalance = new BigNumber(stTotalAmount).dividedBy(
          new BigNumber(10).pow(18 - assetDecimals),
        );

        const tokenAddress =
          asset || '0x0000000000000000000000000000000000000000'; // null address for ETH
        formatter.merge(balances, tokenAddress, adjustedBalance.toFixed());
      }
    }
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
