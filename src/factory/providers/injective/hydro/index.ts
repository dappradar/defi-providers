import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';

const XHDRO_ADDRESS = 'inj1qc2tw477wwuvkad0h3g78xqgwx4k8knat6vz0h';
const HDRO_ADDRESS = 'factory/inj1etz0laas6h7vemg3qtd67jpr6lh8v7xz7gfzqw/hdro';
const HINJ_ADDRESS = 'inj18luqttqyckgpddndh8hvaq25d5nfwjc78m56lc';
const HYDRO_AUTOCOMPOUND_ADDRESS = 'inj1mjcg8a73904rj4w7t5qkgn0apua98n059nufma';
const INJ_ADDRESS = 'inj';

const LOAN_ADDRESS = 'inj1nuw6ala2ra7t457tg4g04k67r94v55mdyq9klr';
const USDT_ADDRESS = 'peggy0xdAC17F958D2ee523a2206206994597C13D831ec7';
const USDT_DECIMALS = 6;

const TOKEN_INFO_METHOD = 'token_info';
const STATE_METHOD = 'state';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};

  // Original hydro TVL
  balances[HDRO_ADDRESS] = await web3.eth
    .call(XHDRO_ADDRESS, TOKEN_INFO_METHOD)
    .then((data) => data.total_supply);
  const hinjSupply = await web3.eth
    .call(HINJ_ADDRESS, TOKEN_INFO_METHOD)
    .then((data) => data.total_supply);
  balances[INJ_ADDRESS] = new BigNumber(balances[INJ_ADDRESS] || 0).plus(
    hinjSupply,
  );
  balances[INJ_ADDRESS] = new BigNumber(balances[INJ_ADDRESS] || 0).plus(
    await web3.eth
      .call(HYDRO_AUTOCOMPOUND_ADDRESS, STATE_METHOD)
      .then((data) => data.total_bonded),
  );

  try {
    const assetStateResponse = await web3.eth.call(
      LOAN_ADDRESS,
      'asset_states',
      { limit: 100 },
    );

    let loanTvlUsd = new BigNumber(0);
    for (const assetState of assetStateResponse.asset_states) {
      const denom = assetState.denom;
      const [priceResponse, assetConfigResponse] = await Promise.all([
        web3.eth.call(LOAN_ADDRESS, 'usd_price', { denom }),
        web3.eth.call(LOAN_ADDRESS, 'asset_config', { denom }),
      ]);

      const decimals = new BigNumber(assetConfigResponse.decimals);
      const price = new BigNumber(priceResponse.price);
      const amount = new BigNumber(assetState.collateral.amount);
      const amountDownScaled = amount.div(new BigNumber(10).pow(decimals));
      const usdValue = amountDownScaled.times(price);
      loanTvlUsd = loanTvlUsd.plus(usdValue);
    }

    const usdtTvl = loanTvlUsd.times(new BigNumber(10).pow(USDT_DECIMALS));
    balances[USDT_ADDRESS] = new BigNumber(balances[USDT_ADDRESS] || 0).plus(
      usdtTvl,
    );
  } catch (e) {
    // Skip loan TVL if it fails
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
