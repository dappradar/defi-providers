import BigNumber from 'bignumber.js';
import { getChainData } from '@connext/nxtp-utils';
import contractDeployments from '@connext/nxtp-contracts/deployments.json';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const WGLMR_ADDRESS = '0xacc15dc74880c9944775448304b263d191c6077f';

async function getDeployedContractAddress(chainId) {
  const record = contractDeployments[String(chainId)]
    ? contractDeployments[String(chainId)]
    : {};
  const name = Object.keys(record)[0];
  if (!name) {
    return undefined;
  }
  const contract = record[name]?.contracts?.TransactionManager;
  return contract ? contract.address : undefined;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 171247) {
    return {};
  }

  const balances = {};
  const contractAddress = await getDeployedContractAddress(1284);

  const chainData = await getChainData();

  const _chain = chainData.get('1284');
  const glmrBalance = await web3.eth.getBalance(contractAddress, block);

  const tokenBalances = await util.getTokenBalances(
    contractAddress,
    Object.keys(_chain.assetId),
    block,
    chain,
    web3,
  );
  tokenBalances.push({
    token: WGLMR_ADDRESS,
    balance: BigNumber(glmrBalance),
  });

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
