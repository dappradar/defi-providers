import BigNumber from 'bignumber.js';
import abi from './abi.json';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { request, gql } from 'graphql-request';

const SYNTHETIX_STATE = '0x4b9Ca5607f1fF8019c1C6A3c2f0CC8de622D5B82';
const SYNTHETIX = '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f';
const GRAPHQL_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix';
const QUERY_NO_BLOCK = gql`
  query snxholders($block: Int) {
    snxholders(
      orderBy: collateral
      orderDirection: desc
      block: { number: 16276865 }
      where: { collateral_gt: 0 }
      first: 500
    ) {
      id
      collateral
    }
  }
`;

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

async function SNXHolders(block) {
  for (let i = block; i > block - 10000; i -= 100) {
    try {
      return (
        await request(GRAPHQL_ENDPOINT, QUERY_NO_BLOCK, {
          block,
        })
      ).snxholders;
    } catch (e) {
      console.log(`Issue with SubGraph on block block`);
    }
  }
}

export { tvl };
