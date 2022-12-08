import abi from './abi.json';
import BigNumber from 'bignumber.js';
import util from '../../../../../../dappradar-defi-tracker/sdk/util.js';
import { ITvlParams } from '../../../../interfaces/ITvl';
import { ITvlReturn } from '../../../../interfaces/ITvl';

const registryAdapterAddresses = [
  '0xF4fB8903A41fC78686b26DE55502cdE42a4c6c78', // V1 Vaults
  '0x14d6E0908baE40A2487352B2a9Cb1A6232DA8785', // V2 Vaults
  '0xec7Ac8AC897f5082B2c3d4e8D2173F992A097F24', // Iron Bank
  '0x560144C25E53149aC410E5D33BDB131e49A850e5', // veCRV
  '0x1007eD6fdFAC72bbea9c719cf1Fa9C355D248691', // Earn
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block } = params;
  const adapterAssetAddresses = await util.executeCallOfMultiTargets(
    registryAdapterAddresses,
    abi,
    'assetsAddresses',
    [],
    block,
  );

  const tvlBreakdowns = await Promise.all(
    registryAdapterAddresses.map((adaptarAddress, index) =>
      util.executeMultiCallsOfTarget(
        adaptarAddress,
        abi,
        'assetTvlBreakdown',
        adapterAssetAddresses[index],
        block,
      ),
    ),
  );

  const tokenBalances = [];
  tvlBreakdowns.forEach((breakdowns) => {
    if (breakdowns) {
      breakdowns.forEach((breakdown) => {
        if (breakdown) {
          tokenBalances.push({
            token: breakdown[1].toLowerCase(),
            balance: BigNumber(breakdown[3]),
          });
        }
      });
    }
  });

  const balances = {};
  util.sumMultiBalanceOf(balances, tokenBalances);
  util.convertBalancesToFixed(balances);

  return balances;
}

export { tvl };
