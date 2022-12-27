import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';

const START_BLOCK = 863864;
let getContractsPromise;
let getAssetsPromise;

async function getContracts() {
  if (!getContractsPromise)
    getContractsPromise = (
      await axios.get(
        'https://raw.githubusercontent.com/connext/nxtp/v0.1.40/packages/contracts/deployments.json',
      )
    ).data;
  return getContractsPromise;
}
async function getAssetIds(chainId) {
  const url =
    'https://raw.githubusercontent.com/connext/chaindata/main/crossChain.json';
  if (!getAssetsPromise) getAssetsPromise = (await axios.get(url)).data;
  const data = await getAssetsPromise;
  const chainData = data.find((item) => item.chainId == chainId) || {};
  return Object.keys(chainData.assetId || {}).map((id) => id.toLowerCase());
}

async function getDeployedContractAddress(chainId) {
  const contracts = await getContracts();
  const record = contracts[String(chainId)] || {};
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
  const assetId = await getAssetIds('1285');

  const tokenBalances = await util.getTokenBalances(
    contractAddress,
    assetId,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
