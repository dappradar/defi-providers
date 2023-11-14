import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';

const START_BLOCK = 146290876;
const SimpleGToken = '0xAC29F414FB40BA4e29Ab8504a55cBfFD315D2430'; // SimpleGToken
const Treasury = '0x15c80BbC0D05656002BD922BFbf46e185BCa5A9e'; // Treasury
const Staking = '0x05027E21F6cEfb38970f4e0c04cD6DacA15aCBcE'; // Staking

const USDC_TOKEN = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'; // USDC
const CNG_TOKEN = '0x4e7e5023656863E26f50E2E6E59489A852C212c1'; // CNG

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const tokenBalances = await Promise.all([
    util.getTokenBalances(SimpleGToken, [USDC_TOKEN], block, chain, web3),
    util.getTokenBalances(Treasury, [USDC_TOKEN], block, chain, web3),
    util.getTokenBalances(Staking, [CNG_TOKEN], block, chain, web3),
  ]);
  // console.log(tokenBalances[0], tokenBalances[1], tokenBalances[2]);

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances[0]);
  formatter.sumMultiBalanceOf(balances, tokenBalances[1]);
  formatter.sumMultiBalanceOf(balances, tokenBalances[2]);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
