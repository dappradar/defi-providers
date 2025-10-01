import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import axios from 'axios';
import basicUtil from '../../../../util/basicUtil';

const PACKAGE_ID =
  '0xc83d5406fd355f34d3ce87b35ab2c0b099af9d309ba96c17e40309502a49976f';
const VAULTS_API_URL =
  'https://vaults.api.sui-prod.bluefin.io/api/v1/vaults/info';
const DUMMY_SENDER =
  '0xbaef681eafe323b507b76bdaf397731c26f46a311e5f3520ebb1bde091fff295';

async function getEmberVaultBalances(
  web3: any,
): Promise<{ [key: string]: string }> {
  const balances = {};

  let vaultsData;
  try {
    const response = await axios.get(VAULTS_API_URL);
    vaultsData = response.data.Vaults;
    await basicUtil.saveIntoCache(
      vaultsData,
      'emberVaultsData.json',
      'sui',
      'ember',
    );
  } catch (e) {
    vaultsData = await basicUtil.readFromCache(
      'emberVaultsData.json',
      'sui',
      'ember',
    );
  }

  if (!vaultsData) {
    return balances;
  }

  for (const vault of Object.values(vaultsData)) {
    try {
      const vaultData = vault as any;
      const vaultTvl = await web3.query({
        target: `${PACKAGE_ID}::vault::get_vault_tvl`,
        contractId: vaultData.ObjectId,
        typeArguments: [vaultData.DepositCoinType, vaultData.ReceiptCoinType],
        sender: DUMMY_SENDER,
      });

      if (vaultTvl && vaultTvl[0]) {
        const bytes = vaultTvl[0];
        let value = 0n;
        for (let i = 0; i < bytes.length; i++) {
          value += BigInt(bytes[i]) << BigInt(i * 8);
        }
        formatter.merge(balances, vaultData.DepositCoinType, value.toString());
      }
    } catch (error) {}
  }

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const emberBalances = await getEmberVaultBalances(web3);
    balances = formatter.sum([balances, emberBalances]);
  } catch (error) {}

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
