import BigNumber from 'bignumber.js';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const PCV_DEPOSIT_ADDRESS = '0x5d6446880FCD004c851EA8920a628c70Ca101117';
const FEI_STAKING_ADDRESS = '0x18305DaAe09Ea2F4D51fAa33318be5978D251aBd';
const FEI_ETH_LP_ADDRESS = '0x94b0a3d511b6ecdb17ebf877278ab030acb0a878';
const FEI_TRIBE_LP_ADDRESS = '0x9928e4046d7c6513326ccea028cd3e7a91c7590a';
const TRIBE_ADDRESS = '0xc7283b66eb1eb5fb86327f08e1b5816b0720212b';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 12125705) {
    return {};
  }

  const tokens = [FEI_ETH_LP_ADDRESS, FEI_TRIBE_LP_ADDRESS, TRIBE_ADDRESS];
  const results = await util.executeMultiCallsOfMultiTargets(
    tokens,
    ERC20_ABI,
    'balanceOf',
    [[PCV_DEPOSIT_ADDRESS], [FEI_STAKING_ADDRESS], [FEI_STAKING_ADDRESS]],
    block,
    chain,
    web3,
  );

  const balanceResults = tokens.map((token, index) => ({
    token,
    balance: BigNumber(results[index] || 0),
  }));

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );
  return { balances };
}

export { tvl };
