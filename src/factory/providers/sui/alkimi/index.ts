import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';

const STAKING_VAULT =
  '0xc92fe84368fc3ff40713792c750709501fcfc4869f120755fd0bea5cac1ead94';
const ALKIMI_ADDRESS =
  '0x1a8f4bc33f8ef7fbc851f156857aa65d397a6a6fd27a7ac2ca717b51f2fd9489::alkimi::ALKIMI';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};

  try {
    const vault = await web3.getObject(STAKING_VAULT);

    if (!vault) {
      return { balances };
    }

    const total = BigInt(vault.balance || '0');

    if (total > 0n) {
      formatter.merge(balances, ALKIMI_ADDRESS, total.toString());
    }
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching Alkimi staking TVL',
      endpoint: 'tvl',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
