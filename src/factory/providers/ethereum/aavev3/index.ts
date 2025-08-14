import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import aaveV3 from '../../../../util/calculators/aaveV3';
import PENDLE_PT_ABI from '../../../../constants/abi/pendlePTAbi.json';
import PENDLE_SY_ABI from '../../../../constants/abi/pendleSYAbi.json';
import BigNumber from 'bignumber.js';

const START_BLOCK = 16291078;
const POOL_DATA_PROVIDERS = [
  '0x41393e5e337606dc3821075Af65AeE84D7688CBD',
  '0x08795CFE08C7a81dCDFf482BbAAF474B240f31cD',
  '0xE7d490885A68f00d9886508DF281D67263ed5758',
];

async function convertPTTokensToUnderlying(balances, block, chain, web3) {
  const convertedBalances = { ...balances };

  for (const tokenAddress of Object.keys(balances)) {
    try {
      const contract = new web3.eth.Contract(PENDLE_PT_ABI, tokenAddress);

      let syAddress;
      let ytAddress;

      try {
        syAddress = await contract.methods.SY().call(null, block);
        ytAddress = await contract.methods.YT().call(null, block);
      } catch (e) {
        continue;
      }

      if (syAddress && ytAddress) {
        console.log(
          `Detected PT token: ${tokenAddress}, SY: ${syAddress}, YT: ${ytAddress}`,
        );

        const syContract = new web3.eth.Contract(PENDLE_SY_ABI, syAddress);

        try {
          const assetInfo = await syContract.methods
            .assetInfo()
            .call(null, block);
          const underlyingAssetAddress = assetInfo.assetAddress;

          if (underlyingAssetAddress) {
            console.log(
              `PT token ${tokenAddress} underlying asset: ${underlyingAssetAddress}`,
            );

            const ptBalance = convertedBalances[tokenAddress];

            convertedBalances[underlyingAssetAddress] = BigNumber(
              convertedBalances[underlyingAssetAddress] || 0,
            )
              .plus(BigNumber(ptBalance))
              .toFixed();

            delete convertedBalances[tokenAddress];

            console.log(
              `Converted PT token ${tokenAddress} balance ${ptBalance} to underlying ${underlyingAssetAddress}`,
            );
          }
        } catch (e) {
          console.log(
            `Error getting underlying asset for PT token ${tokenAddress}:`,
            e.message,
          );
        }
      }
    } catch (e) {
      continue;
    }
  }

  return convertedBalances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  let summedBalances = {};

  for (const poolDataProvider of POOL_DATA_PROVIDERS) {
    const balances = await aaveV3.getTvl(poolDataProvider, block, chain, web3);
    console.log('balances', balances);
    summedBalances = formatter.sum([summedBalances, balances]);
  }

  console.log('summedBalances', summedBalances);

  const convertedBalances = await convertPTTokensToUnderlying(
    summedBalances,
    block,
    chain,
    web3,
  );

  formatter.convertBalancesToFixed(convertedBalances);
  return { balances: convertedBalances };
}
export { tvl };
