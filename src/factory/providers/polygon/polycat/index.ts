import BigNumber from 'bignumber.js';
import CHEF_ABI from './abi/masterchef.json';
import VAULT_ABI from './abi/vault.json';
import STRAT_ABI from './abi/strat.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';

const CHEF_ADDRESS = '0x8CFD1B9B7478E7B0422916B72d1DB6A9D513D734';
const VAULT_ADDRESS = '0xBdA1f897E851c7EF22CD490D2Cf2DAce4645A904';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 13924798) {
    return {};
  }

  const contract = new web3.eth.Contract(CHEF_ABI, CHEF_ADDRESS);
  const vaultContract = new web3.eth.Contract(VAULT_ABI, VAULT_ADDRESS);

  let poolLength = 0;
  try {
    poolLength = await contract.methods.poolLength().call(null, block);
  } catch (e) {
    console.log(e.message);
  }

  let pools = [];
  try {
    pools = basicUtil.readDataFromFile('./pools.json', chain, provider);
  } catch {}

  for (let first = pools.length; first < poolLength; first += 300) {
    const last = Math.min(poolLength, first + 300);
    const poolCalls = [];
    for (let start = first; start < last; start += 1) {
      poolCalls.push(contract.methods.poolInfo(start).call());
    }
    try {
      const poolResults = await Promise.all(poolCalls);
      poolResults.forEach((result) => {
        pools.push(result.lpToken);
      });
    } catch {
      break;
    }
  }
  await basicUtil.writeDataToFile(pools, './pools.json', chain, provider);

  const tokenBalances = {};

  let balanceResults = await util.getTokenBalances(
    CHEF_ADDRESS,
    pools,
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults);

  let wantLength = 0;
  try {
    wantLength = await vaultContract.methods.poolLength().call(null, block);
  } catch (e) {
    console.log(e.message);
  }

  let wants = [];
  try {
    wants = basicUtil.readDataFromFile('./wants.json', chain, provider);
  } catch {}

  for (let first = wants.length; first < wantLength; first += 300) {
    const last = Math.min(wantLength, first + 300);
    const wantCalls = [];
    for (let start = first; start < last; start += 1) {
      wantCalls.push(vaultContract.methods.poolInfo(start).call());
    }
    try {
      const wantResults = await Promise.all(wantCalls);
      wantResults.forEach((result) => {
        wants.push({
          want: result.want,
          strat: result.strat,
        });
      });
    } catch {
      break;
    }
  }

  await basicUtil.writeDataToFile(wants, './wants.json', chain, provider);

  const results = await util.executeCallOfMultiTargets(
    wants.map((want) => want.strat),
    STRAT_ABI,
    'wantLockedTotal',
    [],
    block,
    chain,
    web3,
  );

  balanceResults = [];
  wants.forEach((want, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: want.want,
        balance,
      });
    }
  });

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
