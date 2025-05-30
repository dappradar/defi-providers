import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const ARIES_ADDRESS =
  '0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3';
const RESERVE_COIN_CONTAINER_TYPE = `${ARIES_ADDRESS}::reserve::ReserveCoinContainer`;
const FA_WRAPPER_TYPE = `${ARIES_ADDRESS}::fa_to_coin_wrapper::WrapperCoinInfo`;

const extractCoinAddress = (str: string) =>
  str.slice(str.indexOf('<') + 1, str.lastIndexOf('>'));

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};

  try {
    const resourcesCache = await web3.eth.getResources(ARIES_ADDRESS);

    const coinContainers = resourcesCache
      .filter((token) => token.type.includes(RESERVE_COIN_CONTAINER_TYPE))
      .map((i) => ({
        lamports: i.data.underlying_coin.value,
        tokenAddress: extractCoinAddress(i.type),
      }));

    const faWrappers = resourcesCache
      .filter((token) => token.type.includes(FA_WRAPPER_TYPE))
      .map((i) => ({
        lamports: i.data.fa_amount,
        faAddress: i.data.metadata.inner,
      }));

    coinContainers.forEach(({ lamports, tokenAddress }) => {
      if (tokenAddress && lamports !== '0') {
        formatter.merge(balances, tokenAddress, lamports);
      }
    });

    faWrappers.forEach(({ lamports, faAddress }) => {
      if (faAddress && lamports !== '0') {
        formatter.merge(balances, faAddress, lamports);
      }
    });
  } catch (error) {
    console.log('Error fetching Aries data:', error);
  }

  formatter.mapAptosTokenAddresses(balances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
