import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';
import suiTokens from '../../../../constants/tokens/sui.json';

const SBUCK_FOUNTAIN_ID =
  '0xbdf91f558c2b61662e5839db600198eda66d502e4c10c4fc5c683f9caca13359';
const SPARKLING_SBUCK_FLASK_ID =
  '0xc6ecc9731e15d182bc0a46ebe1754a779a4bfb165c201102ad51a36838a1a7b8';

async function getFountainStaking(
  web3: any,
): Promise<{ [key: string]: string }> {
  const balances = {};

  try {
    const object = await web3.getObject(SBUCK_FOUNTAIN_ID);

    const staked = object?.staked;

    const flask = await web3.getObject(SPARKLING_SBUCK_FLASK_ID);

    const buck_reserve = flask?.reserves;
    const sbuck_supply = flask?.sbuck_supply?.fields?.value;
    const sbuck_to_buck_price = Number(buck_reserve) / Number(sbuck_supply);

    const exchanged_buck = sbuck_to_buck_price * Number(staked);

    if (exchanged_buck > 0) {
      formatter.merge(balances, suiTokens.BUCK, exchanged_buck.toString());
    }
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching Fountain staking',
      endpoint: 'getFountainStaking',
    });
  }

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const fountainBalances = await getFountainStaking(web3);
    balances = formatter.sum([balances, fountainBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching Fountain TVL',
      endpoint: 'tvl',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
