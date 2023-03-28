import BigNumber from 'bignumber.js';
import FACTORY_ABI from './abi.json';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const FACTORY_ADDRESS = '0x7b9a695421FfB5D0EAF1a634d85524e07d4662eE';
const TUNNEL_ADDRESS = '0x258a1eb6537ae84cf612f06b557b6d53f49cc9a1';
const BOR_ADDRESS = '0x3c9d6c1C73b31c837832c72E04D3152f051fc1A9';
const OBTC_ADDRESS = '0x8064d9ae6cdf087b1bcd5bdf3531bd5d8c537a68';
const WBTC_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
let data = [];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 11241692) {
    return {};
  }

  const contract = new web3.eth.Contract(FACTORY_ABI, FACTORY_ADDRESS);

  try {
    data = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  for (let i = data.length; ; i += 1) {
    try {
      const token = await contract.methods.stakingTokens(i).call(null, block);
      const pool = await contract.methods
        .poolByStakingToken(token)
        .call(null, block);
      data.push({
        address: pool.toLowerCase(),
        token: token.toLowerCase(),
      });
    } catch {
      break;
    }
  }

  basicUtil.writeDataToFile(data, 'cache/pools.json', chain, provider);

  const tokenBalances = {};

  try {
    const obtcContract = new web3.eth.Contract(ERC20_ABI, OBTC_ADDRESS);
    const totalSupply = await obtcContract.methods
      .totalSupply()
      .call(null, block);
    tokenBalances[WBTC_ADDRESS] = BigNumber(totalSupply).div(1e10).toFixed();
  } catch {}

  const pools = data.map((pool) => pool.address).concat(TUNNEL_ADDRESS);
  const tokens = data.map((pool) => pool.token).concat(BOR_ADDRESS);
  const balanceResults = await util.getTokenBalancesOfHolders(
    pools,
    tokens,
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );

  return { balances };
}

export { tvl };
