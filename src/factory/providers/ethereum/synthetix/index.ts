import pageResults from 'graph-results-pager';
import BigNumber from 'bignumber.js';
import abi from './abi.json';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const SYNTHETIX_STATE = '0x4b9Ca5607f1fF8019c1C6A3c2f0CC8de622D5B82';
const SYNTHETIX = '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f';
const GRAPHQL_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const synthetixStateContract = new web3.eth.Contract(abi, SYNTHETIX_STATE);
  const synthetixContract = new web3.eth.Contract(abi, SYNTHETIX);

  let totalTopStakersSNXLocked = new BigNumber(0);
  let totalTopStakersSNX = new BigNumber(0);

  const [holders, issuanceRatio, totalSupply] = await Promise.all([
    SNXHolders(block),
    synthetixStateContract.methods.issuanceRatio().call(null, block),
    synthetixContract.methods.totalSupply().call(null, block),
  ]);

  const ratio = await util.executeMultiCallsOfTarget(
    SYNTHETIX,
    abi,
    'collateralisationRatio',
    holders.map((holder) => [holder.id]),
    block,
    chain,
    web3,
  );

  holders.forEach((holder, index) => {
    const _collateral = holder.collateral;
    totalTopStakersSNX = totalTopStakersSNX.plus(_collateral);
    const _ratio = ratio[index];
    if (_ratio !== '0') {
      const locked = _collateral * Math.min(1, _ratio / issuanceRatio);
      totalTopStakersSNXLocked = totalTopStakersSNXLocked.plus(locked);
    }
  });

  const balances = {
    [SYNTHETIX]: totalTopStakersSNXLocked
      .div(totalTopStakersSNX)
      .times(new BigNumber(totalSupply))
      .toFixed(),
  };

  return { balances };
}

// Uses graph protocol to run through SNX contract. Since there is a limit of 100 results per query
// we can use graph-results-pager library to increase the limit.
async function SNXHolders(blockNumber) {
  for (let i = blockNumber; i > blockNumber - 10000; i -= 100) {
    try {
      console.log(`Trying to get Holders on block ${i}`);
      const result = await pageResults({
        api: GRAPHQL_ENDPOINT,
        query: {
          entity: 'snxholders',
          selection: {
            orderBy: 'collateral',
            orderDirection: 'desc',
            block: {
              number: i,
            },
            where: {
              collateral_gt: 0,
            },
          },
          properties: ['collateral', 'id'],
        },
        max: 500, // top 5000 SNX holders with collateral. At the time of this commit, there are 51,309 SNX holders. (7/27/2020)
      });
      return result;
    } catch (e) {
      console.log(`Issue with SubGraph on block ${i - 100}`);
    }
  }
  return null;
}

export { tvl };
