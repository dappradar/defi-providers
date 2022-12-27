import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import axios from 'axios';

const WGLMR_ADDRESS = '0xacc15dc74880c9944775448304b263d191c6077f';
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
  if (block < 171247) {
    return {};
  }

  const balances = {};
  const contractAddress = await getDeployedContractAddress(1284);
  const assets = await getAssetIds('1284');
  const glmrBalance = await web3.eth.getBalance(contractAddress, block);

  const tokenBalances = await util.getTokenBalances(
    contractAddress,
    assets,
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
