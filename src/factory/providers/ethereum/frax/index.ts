import abi from './abi.json';
import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const FEI3CRVs = [
  '0x70F55767B11c047C8397285E852919F5f6c8DC60',
  '0xE4BD0461AE7fdc76c61CE286a80c9B55d83B204a',
];
const contractAddresses = [
  '0x49ee75278820f409ecd67063D8D717B38d66bd71', // FRAX3CRV
  '0x72170Cdc48C33a6AE6B3E83CD387ca3Fb9105da2', // CURVE_AMO
  '0xcf37B62109b537fa0Cb9A90Af4CA72f6fb85E241', // FRAX_AMO_MINTER
  '0x9507189f5B6D820cd93d970d67893006968825ef', // LENDING_AMO
  '0x1Be588641Fb28Eb8C2A51f1129707FB1E2683f5a', // MANUAL_AMO
  '0x3C2982CA260e870eee70c423818010DfeF212659', // USDC_POOL_V1
  '0x1864Ca3d47AaB98Ee78D11fc9DCC5E7bADdA1c0d', // USDC_POOL_V2
  '0x2fE065e6FFEf9ac95ab39E5042744d695F560729', // USDC_POOL_V3
  '0xEE5825d5185a1D512706f9068E69146A54B6e076', // INVESTOR_COLLATERAL_POOL
  '0xB8315Af919729c823B2d996B1A6DDE381E7444f1', // INVESTOR_AMO_V2
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};

  // --- CurveMetapoolLockerAMOs USDC TVL ---
  const usdValueInVault = await util.executeCallOfMultiTargets(
    FEI3CRVs,
    abi,
    'usdValueInVault',
    [],
    block,
    chain,
    web3,
  );

  usdValueInVault.forEach((value) => {
    if (value) {
      balances[USDC] = balances[USDC]
        ? BigNumber(balances[USDC]).plus(
            BigNumber(value).dividedBy(1e12).toFixed(),
          )
        : BigNumber(value).dividedBy(1e12).toFixed();
    }
  });

  // // --- USDC POOLs + AMOs + FRAX3CRV and FEI3CRVs ---
  const usdcTvls = await util.executeCallOfMultiTargets(
    contractAddresses,
    abi,
    'collatDollarBalance',
    [],
    block,
    chain,
    web3,
  );

  usdcTvls.forEach((usdcTvl) => {
    if (usdcTvl) {
      balances[USDC] = balances[USDC]
        ? BigNumber(balances[USDC]).plus(
            BigNumber(usdcTvl).dividedBy(1e12).toFixed(),
          )
        : BigNumber(usdcTvl).dividedBy(1e12).toFixed();
    }
  });

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
