import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import ABI from './abi.json';
import BigNumber from 'bignumber.js';

const START_BLOCK = 21593771;
const FACTORY_ADDRESS = '0xC177118F005F87C2e96869A03Bb258481A2Af455';
const BLOCK_LIMIT = 10000;
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
    tokens: string[];
  } = { start: START_BLOCK, tokens: [] };
  try {
    cache = await basicUtil.readFromCache('cache.json', chain, provider);
  } catch {}

  for (
    let i = Math.max(cache.start, START_BLOCK);
    i < block;
    i += BLOCK_LIMIT
  ) {
    const logs = await util.getLogs(
      i,
      Math.min(i + BLOCK_LIMIT - 1, block),
      '0x2e2b3f61b70d2d131b2a807371103cc98d51adcaa5e9a8f9c32658ad8426e74e',
      FACTORY_ADDRESS,
      web3,
    );

    logs.output.forEach((log) => {
      const address = `0x${log.data.substring(26, 66)}`;

      if (!cache.tokens.includes(address)) {
        cache.tokens.push(address);
      }

      cache.start = i += BLOCK_LIMIT;
      basicUtil.saveIntoCache(cache, 'cache.json', chain, provider);
    });
  }

  if (cache.tokens.length > 0) {
    const underlyingAssets = await util.executeCallOfMultiTargets(
      cache.tokens,
      ABI,
      'underlyingAsset',
      [],
      block,
      chain,
      web3,
    );

    const totalSupplies = await util.executeCallOfMultiTargets(
      cache.tokens,
      ABI,
      'totalSupply',
      [],
      block,
      chain,
      web3,
    );

    const tokenDecimals = await util.executeCallOfMultiTargets(
      cache.tokens,
      DECIMALS_ABI,
      'decimals',
      [],
      block,
      chain,
      web3,
    );

    const underlyingAssetAddresses = underlyingAssets.filter(
      (asset) => asset != null,
    );
    const underlyingAssetDecimals = await util.executeCallOfMultiTargets(
      underlyingAssetAddresses,
      DECIMALS_ABI,
      'decimals',
      [],
      block,
      chain,
      web3,
    );

    const underlyingDecimalMap = {};
    underlyingAssetAddresses.forEach((address, index) => {
      if (address && underlyingAssetDecimals[index]) {
        underlyingDecimalMap[address.toLowerCase()] =
          underlyingAssetDecimals[index];
      }
    });

    const tokenBalances = [];
    if (
      underlyingAssets &&
      underlyingAssets.length > 0 &&
      totalSupplies &&
      totalSupplies.length > 0 &&
      tokenDecimals &&
      tokenDecimals.length > 0
    ) {
      const maxLength = Math.min(
        underlyingAssets.length,
        totalSupplies.length,
        tokenDecimals.length,
      );
      for (let i = 0; i < maxLength; i++) {
        const underlyingAssetAddress = underlyingAssets[i];
        const supply = totalSupplies[i];
        const mainTokenDecimal = tokenDecimals[i];

        if (underlyingAssetAddress && supply && mainTokenDecimal) {
          const underlyingDecimal =
            underlyingDecimalMap[underlyingAssetAddress.toLowerCase()];
          if (underlyingDecimal !== undefined) {
            const decimalShiftFactor = new BigNumber(underlyingDecimal)
              .minus(new BigNumber(mainTokenDecimal))
              .toNumber();
            tokenBalances.push({
              token: underlyingAssetAddress,
              balance: new BigNumber(supply).shiftedBy(decimalShiftFactor),
            });
          }
        }
      }
    }

    formatter.sumMultiBalanceOf(balances, tokenBalances);
    formatter.convertBalancesToFixed(balances);
  }

  return { balances };
}

export { tvl };
