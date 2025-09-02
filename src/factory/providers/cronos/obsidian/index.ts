import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import OBSIDIAN_ABI from '../../../../constants/abi/obsidian.json';

const START_BLOCK = 13894687;
const FACTORY_START_BLOCK = 15035762;
const SMART_CHEF_START_BLOCK = 20223660;
const ROBIN_DIAMOND_START_BLOCK = 14413695;

const FACTORY_ADDRESS = '0xCd2E5cC83681d62BEb066Ad0a2ec94Bf301570C9';
const SMART_CHEF_FACTORY = '0x1eC6e891Bdaa523da0F538C9556064D909d0c566';
const ROBIN_DIAMOND_CONTRACT = '0x6D5599616732Ea278235b47A76Cfd398fDe00DEB';
const FIXED_STAKING_CONTRACT = '0x1215B773d67fd9ed17656B08e223caEF4a93904f';

async function getSmartChefStaking(
  factoryAddress: string,
  block: number,
  chain: string,
  web3: any,
): Promise<Array<{ token: string; balance: BigNumber }>> {
  if (block < SMART_CHEF_START_BLOCK) {
    return [];
  }

  try {
    const result = await util.executeCall(
      factoryAddress,
      OBSIDIAN_ABI,
      'getAllPoolTVL',
      [],
      block,
      chain,
      web3,
    );

    const [stakedTokens, stakedAmounts] = result;
    const balanceResults = [];

    for (let i = 0; i < stakedTokens.length; i++) {
      const balance = BigNumber(stakedAmounts[i] || 0);
      if (balance.isGreaterThan(0)) {
        balanceResults.push({
          token: stakedTokens[i],
          balance,
        });
      }
    }

    return balanceResults;
  } catch (error) {
    console.error('Error getting smart chef staking:', error);
    return [];
  }
}

async function getPoolStaking(
  contractAddress: string,
  block: number,
  chain: string,
  web3: any,
  totalDepositedIndex: number,
  contractStartBlock: number,
): Promise<Array<{ token: string; balance: BigNumber }>> {
  if (block < contractStartBlock) {
    return [];
  }

  try {
    const poolLength = await util.executeCall(
      contractAddress,
      OBSIDIAN_ABI,
      'poolLength',
      [],
      block,
      chain,
      web3,
    );

    const poolResults = await util.executeMultiCallsOfTarget(
      contractAddress,
      OBSIDIAN_ABI,
      'pools',
      Array.from(Array(Number(poolLength)), (_, i) => [i]),
      block,
      chain,
      web3,
    );

    const balanceResults = [];

    for (let i = 0; i < poolResults.length; i++) {
      const pool = poolResults[i];
      const totalDeposited = BigNumber(pool[totalDepositedIndex] || 0);

      if (totalDeposited.isGreaterThan(0)) {
        balanceResults.push({
          token: pool[0],
          balance: totalDeposited,
        });
      }
    }

    return balanceResults;
  } catch (error) {
    console.error('Error getting pool staking:', error);
    return [];
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }

  let balances = {};
  let poolBalances = {};

  if (block >= FACTORY_START_BLOCK) {
    const dexResults = await uniswapV2.getTvl(
      FACTORY_ADDRESS,
      block,
      chain,
      provider,
      web3,
    );
    balances = dexResults.balances;
    poolBalances = dexResults.poolBalances;
  }

  const [smartChefStaking, robinDiamondStaking, fixedStaking] =
    await Promise.all([
      getSmartChefStaking(SMART_CHEF_FACTORY, block, chain, web3),
      getPoolStaking(
        ROBIN_DIAMOND_CONTRACT,
        block,
        chain,
        web3,
        3,
        ROBIN_DIAMOND_START_BLOCK,
      ),
      getPoolStaking(
        FIXED_STAKING_CONTRACT,
        block,
        chain,
        web3,
        10,
        START_BLOCK,
      ),
    ]);

  const allStakingResults = [
    ...smartChefStaking,
    ...robinDiamondStaking,
    ...fixedStaking,
  ];

  formatter.sumMultiBalanceOf(balances, allStakingResults);
  formatter.convertBalancesToFixed(balances);

  return { balances, poolBalances };
}

export { tvl };
