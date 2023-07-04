import basicUtil from '../../../../util/basicUtil';
import BVAULTS_ABI from './abis/bvaultsabi.json';
import STRATEGY_ABI from './abis/strategyabi.json';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const BVAULTS_CHEF_ADDR = '0xB390B07fcF76678089cb12d8E615d5Fe494b01Fb';
const SBFI_ADDRESS = '0xaaaf5d9923Be358Ea0b6205Ef2A3B929D460Ac7A';
const BFI_ADDRESS = '0x81859801b01764d4f0fa5e64729f5a6c3b91435b';
const XBDEX_ADDRESS = '0x4cf73a6f72b8093b96264a794064372edb15508e';
const BDEX_ADDRESS = '0x7e0f01918d92b2750bbb18fcebeedd5b94ebb867';
let pools = {};

async function getWants(contract, i) {
  try {
    if (!pools[i]) {
      const poolInfo = await contract.methods.poolInfo(i).call();
      pools[i] = {
        want: poolInfo.want.toLowerCase(),
        strategy: poolInfo.strategy,
      };
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const tokenBalances = {};

  const targets = [BFI_ADDRESS, BDEX_ADDRESS];
  const methodParams = [[SBFI_ADDRESS], [XBDEX_ADDRESS]];
  const balanceResults = await util.executeMultiCallsOfMultiTargets(
    targets,
    ERC20_ABI,
    'balanceOf',
    methodParams,
    block,
    chain,
    web3,
  );

  balanceResults.forEach((result, index) => {
    if (result) {
      tokenBalances[targets[index]] = BigNumber(result);
    }
  });

  const bvaultsContract = new web3.eth.Contract(BVAULTS_ABI, BVAULTS_CHEF_ADDR);
  const poolLength = await bvaultsContract.methods
    .poolLength()
    .call(null, block);

  const poolIDs = Array.from({ length: poolLength }, (v, i) => i);

  try {
    pools = await basicUtil.readFromCache('cache/pools.json', chain, provider);
  } catch {}

  await Promise.all(poolIDs.map((id) => getWants(bvaultsContract, id)));

  await basicUtil.saveIntoCache(pools, 'cache/pools.json', chain, provider);

  const results = await util.executeCallOfMultiTargets(
    poolIDs.map((id) => pools[id].strategy),
    STRATEGY_ABI,
    'wantLockedTotal',
    [],
    block,
    chain,
    web3,
  );

  const wantBalances = [];
  poolIDs.forEach((id, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      wantBalances.push({
        token: pools[id].want,
        balance,
      });
    }
  });

  formatter.sumMultiBalanceOf(tokenBalances, wantBalances, chain, provider);

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
