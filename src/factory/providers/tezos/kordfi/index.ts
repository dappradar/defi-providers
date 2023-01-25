import { request, gql } from 'graphql-request';
import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 2611000;
const BTC_TOKEN = 'KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn';
const GRAPHQL_ENDPOINT = 'https://back-mainnet.kord.fi/v1/graphql';
const CURRENT_TVL_QUERY = gql`
  query getCurrentTvlData {
    contractInfo {
      tzbtcDeposit
      tzbtcDepositIndex
      xtzDeposit
      xtzDepositIndex
      xtzLbShares
      tzbtcLbShares
    }
    externalInfo {
      lbXtzRate
      lbTzbtcRate
    }
  }
`;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const tvlData = await request(GRAPHQL_ENDPOINT, CURRENT_TVL_QUERY);

  balances['xtz'] = BigNumber(tvlData['contractInfo'][0]['xtzDeposit'])
    .times(tvlData['contractInfo'][0]['xtzDepositIndex'])
    .plus(
      BigNumber(tvlData['contractInfo'][0]['xtzLbShares']).times(
        BigNumber(tvlData['externalInfo'][0]['lbXtzRate']).shiftedBy(6),
      ),
    )
    .plus(
      BigNumber(tvlData['contractInfo'][0]['tzbtcLbShares']).times(
        tvlData['externalInfo'][0]['lbTzbtcRate'],
      ),
    )
    .toFixed();

  balances[BTC_TOKEN] = BigNumber(tvlData['contractInfo'][0]['tzbtcDeposit'])
    .times(tvlData['contractInfo'][0]['tzbtcDepositIndex'])
    .toFixed();

  return { balances };
}

export { tvl };
