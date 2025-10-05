import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';

const VAULT_IDS = [
  '0xb950819c5eba1bb5980f714f2a3b1d8738e3da58a4d9daf5fa21b6c2a7dd1e12',
  '0x2d6e81126336685a28ea0637109b570510f988bba2b589877c9b579d3cb8cad8',
  '0x3062285974a5e517c88cf3395923aac788dce74f3640029a01e25d76c4e76f5d',
  '0x0ff688058077c00a6b6df737e605dbb1fccfb5760246c5d3aaaacc750cb42384',
];

async function getMetastableBalances(
  web3: any,
): Promise<{ [key: string]: string }> {
  const balances = {};

  const vaultData = await web3.getObjects(VAULT_IDS);

  for (const vault of vaultData) {
    const {
      fields: { metadata },
    } = vault;

    const dynamicFields = await web3.getDynamicFields({
      parent: metadata.fields.id.id,
      limit: 48,
    });

    const fieldObjects = await web3.getDynamicFieldObjects({
      parent: metadata.fields.id.id,
    });

    let i = 0;
    for (const field of dynamicFields) {
      const coin = field.name.value.name;
      const amount = fieldObjects[i].balance;

      if (amount && amount !== '0') {
        const coinAddress = '0x' + coin;
        formatter.merge(balances, coinAddress, amount);
      }
      i++;
    }
  }

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const metastableBalances = await getMetastableBalances(web3);
    balances = formatter.sum([balances, metastableBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching Metastable TVL',
      endpoint: 'tvl',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
