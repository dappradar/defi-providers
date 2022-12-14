import { getChainData } from '@connext/nxtp-utils';
import contractDeployments from '@connext/nxtp-contracts/deployments.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 863864;

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
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const contractAddress = await getDeployedContractAddress(1285);
  const chainData = await getChainData();
  const _chain = chainData.get('1285');

  const tokenBalances = await util.getTokenBalances(
    contractAddress,
    Object.keys(_chain.assetId),
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
