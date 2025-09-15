import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import FLUID_LIQUIDITY_RESOLVER_ABI from './../../../../constants/abi/fluidLiquidityResolverAbi.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const FLUID_LIQUIDITY_RESOLVER_ADDRESS =
  '0x741c2Cd25f053a55fd94afF1afAEf146523E1249';
const FLUID_LIQUIDITY_RESOLVER_ADDRESS_2 =
  '0xD7588F6c99605Ab274C211a0AFeC60947668A8Cb';
const FLUID_LIQUIDITY_PROXY_ADDRESS =
  '0x52aa899454998be5b000ad077a46bbe360f4e497';
const START_BLOCK = 19239123;
const ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const WEETH_ADDRESS = '0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee';
const ZIRCUIT_ADDRESS = '0xF047ab4c75cebf0eB9ed34Ae2c186f3611aEAfa6';
const WEETHS_ADDRESS = '0x917ceE801a67f933F2e6b33fC0cD1ED2d5909D88';
const ZIRCUIT_ABI = [
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'balance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

const vaults = [
  {
    vault: '0xc383a3833A87009fD9597F8184979AF5eDFad019',
    token: util.ZERO_ADDRESS,
  },
  {
    vault: '0xc8871267e07408b89aA5aEcc58AdCA5E574557F8',
    token: '0xa0b86a33e6b3b5c4fbf35b90175d7452b01e029b',
  },
  {
    vault: '0xEC363faa5c4dd0e51f3D9B5d0101263760E7cdeB',
    token: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  },
  {
    vault: '0x40a9d39aa50871Df092538c5999b107f34409061',
    token: '0x6b175474e89094c44da98b954eedeac495271d0f',
  },
];

const vaultsV2 = ['0xA0D3707c569ff8C87FA923d3823eC5D81c98Be78'];

const VAULT_ABI = [
  {
    inputs: [],
    name: 'getCurrentExchangePrice',
    outputs: [
      { internalType: 'uint256', name: 'exchangePrice_', type: 'uint256' },
      { internalType: 'uint256', name: 'newTokenRevenue_', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lastRevenueExchangePrice',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'asset',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalAssets',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const liquidityResolverAddress =
    block < 19992056
      ? FLUID_LIQUIDITY_RESOLVER_ADDRESS
      : FLUID_LIQUIDITY_RESOLVER_ADDRESS_2;

  const listedTokens = await util.executeCall(
    liquidityResolverAddress,
    FLUID_LIQUIDITY_RESOLVER_ABI,
    'listedTokens',
    [],
    block,
    chain,
    web3,
  );

  const balances = {
    [util.ZERO_ADDRESS]: await web3.eth.getBalance(
      FLUID_LIQUIDITY_PROXY_ADDRESS,
      block,
    ),
  };

  balances[WEETHS_ADDRESS] = await util.executeCall(
    ZIRCUIT_ADDRESS,
    ZIRCUIT_ABI,
    'balance',
    [WEETHS_ADDRESS, FLUID_LIQUIDITY_PROXY_ADDRESS],
    block,
    chain,
    web3,
  );

  balances[WEETH_ADDRESS] = await util.executeCall(
    ZIRCUIT_ADDRESS,
    ZIRCUIT_ABI,
    'balance',
    [WEETH_ADDRESS, FLUID_LIQUIDITY_PROXY_ADDRESS],
    block,
    chain,
    web3,
  );

  const tokenBalances = await util.getTokenBalances(
    FLUID_LIQUIDITY_PROXY_ADDRESS,
    listedTokens.filter((token: any) => token.token !== ETH_ADDRESS),
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances);

  // Handle vault calculations
  if (vaults.length > 0) {
    const vaultTargets = vaults.map((v) => v.vault);

    // Try getCurrentExchangePrice first
    let prices;
    try {
      prices = await util.executeCallOfMultiTargets(
        vaultTargets,
        VAULT_ABI,
        'getCurrentExchangePrice',
        [],
        block,
        chain,
        web3,
      );
    } catch {
      // Fallback to lastRevenueExchangePrice
      prices = await util.executeCallOfMultiTargets(
        vaultTargets,
        VAULT_ABI,
        'lastRevenueExchangePrice',
        [],
        block,
        chain,
        web3,
      );
    }

    // Get total supplies
    const supplies = await util.executeCallOfMultiTargets(
      vaultTargets,
      VAULT_ABI,
      'totalSupply',
      [],
      block,
      chain,
      web3,
    );

    // Calculate vault balances
    prices.forEach((price, i) => {
      if (price && supplies[i]) {
        const exchangePrice = price.exchangePrice_ || price;
        const tokenAddress = vaults[i].token;
        const vaultBalance = BigNumber(exchangePrice)
          .times(supplies[i])
          .div(1e18);

        balances[tokenAddress] = BigNumber(balances[tokenAddress] || 0)
          .plus(vaultBalance)
          .toFixed();
      }
    });
  }

  // Handle ERC4626 vaults
  if (vaultsV2.length > 0) {
    const assets = await util.executeCallOfMultiTargets(
      vaultsV2,
      VAULT_ABI,
      'asset',
      [],
      block,
      chain,
      web3,
    );

    const totalAssets = await util.executeCallOfMultiTargets(
      vaultsV2,
      VAULT_ABI,
      'totalAssets',
      [],
      block,
      chain,
      web3,
    );

    assets.forEach((asset, i) => {
      if (asset && totalAssets[i]) {
        balances[asset] = BigNumber(balances[asset] || 0)
          .plus(totalAssets[i])
          .toFixed();
      }
    });
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
