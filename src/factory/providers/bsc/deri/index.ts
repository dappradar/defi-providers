import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';

const START_BLOCK = 37069498;
const FACTORY_ADDRESS = '0x2c2E1eE20C633EAe18239c0BF59cEf1FC44939aC';
const BLOCK_LIMIT = 10000;

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
      const vaultAddress = `0x${log.data.substring(90, 130)}`;

      if (!cache.vaults.includes(vaultAddress)) {
        cache.vaults.push(vaultAddress);
      }
    });

    cache.start = Math.min(i + BLOCK_LIMIT, block);
    basicUtil.saveIntoCache(cache, 'cache.json', chain, provider);
  }

  if (cache.vaults.length > 0) {
    const stTotalAmounts = await util.executeCallOfMultiTargets(
      cache.vaults,
      VAULT_ABI,
      'stTotalAmount',
      [],
      block,
      chain,
      web3,
    );

    const assets = await util.executeCallOfMultiTargets(
      cache.vaults,
      VAULT_ABI,
      'asset',
      [],
      block,
      chain,
      web3,
    );

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

    const decimalMap = {};
    let decimalIndex = 0;
    assets.forEach((asset, index) => {
      if (asset !== null) {
        decimalMap[index] = decimals[decimalIndex] || 18;
        decimalIndex++;
      } else {
        decimalMap[index] = 18;
      }
    });

    for (let i = 0; i < cache.vaults.length; i++) {
      const stTotalAmount = stTotalAmounts[i];
      const asset = assets[i];
      const assetDecimals = decimalMap[i];

      if (stTotalAmount && stTotalAmount !== '0') {
        const adjustedBalance = new BigNumber(stTotalAmount).dividedBy(
          new BigNumber(10).pow(18 - assetDecimals),
        );

        const tokenAddress =
          asset || '0x0000000000000000000000000000000000000000';
        formatter.merge(balances, tokenAddress, adjustedBalance.toFixed());
      }
    }
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
