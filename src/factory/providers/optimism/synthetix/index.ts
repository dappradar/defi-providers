import BigNumber from 'bignumber.js';
import SYSTEM_SETTINGS_ABI from './abi/systemSettings.json';
import MINTABLE_SYNTHETIX_ABI from './abi/mintableSynthetix.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import { gql, request } from 'graphql-request';
import basicUtil from '../../../../util/basicUtil';

const START_BLOCK = 12840848;
const SYSTEM_SETTINGS = '0x05e1b1dff853b1d67828aa5e8cb37cc25aa050ee';
const MINTABLE_SYNTHETIX = '0xfe8e48bf36ccc3254081ec8c65965d1c8b2e744d';
const SYNTHETIX = '0x8700daec35af8ff88c16bdf0418774cb3d7599b4';
const GRAPHQL_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/synthetixio-team/optimism-main';
const QUERY_NO_BLOCK = gql`
  query snxholders($block: Int, $skip: Int) {
    snxholders(
      orderBy: collateral
      orderDirection: desc
      block: { number: $block }
      where: { collateral_gt: 0 }
      first: 1000
      skip: $skip
    ) {
      id
      collateral
    }
  }
`;

async function getSnxHolders(block, chain) {
  let holders = [];
  try {
    for (let i = 0; i <= 5000; i += 1000) {
      const holder = (
        await request(GRAPHQL_ENDPOINT, QUERY_NO_BLOCK, {
          block,
          skip: i,
        })
      ).snxholders;
      holders = [...holders, ...holder];
    }
  } catch (e) {
    console.log(`Issue with SubGraph on block ${block}`);
    holders = await getSnxHolders(block - basicUtil.getDelay(chain), chain);
  }

  return holders;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const systemSettingsContract = new web3.eth.Contract(
    SYSTEM_SETTINGS_ABI,
    SYSTEM_SETTINGS,
  );

  let totalTopStakersSNXLocked = new BigNumber(0);
  let totalTopStakersSNX = new BigNumber(0);

  const [holders, issuanceRatio, totalSupply] = await Promise.all([
    getSnxHolders(block, chain),
    systemSettingsContract.methods.issuanceRatio().call(null, block),
    util
      .getTokenTotalSupplies([MINTABLE_SYNTHETIX], block, chain, web3)
      .then((res) => res[0].totalSupply),
  ]);

  const ratio = await util.executeMultiCallsOfTarget(
    MINTABLE_SYNTHETIX,
    MINTABLE_SYNTHETIX_ABI,
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
      .times(totalSupply)
      .toFixed(),
  };
  return { balances };
}
export { tvl };
