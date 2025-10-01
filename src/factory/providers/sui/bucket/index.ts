import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';
import BigNumber from 'bignumber.js';
import suiTokens from '../../../../constants/tokens/sui.json';

const MAINNET_PROTOCOL_ID =
  '0x9e3dab13212b27f5434416939db5dec6a319d15b89a84fd074d03ece6350d3df';
const SUI_HASUI_POOL_ID =
  '0x871d8a227114f375170f149f7e9d45be822dd003eba225e83c05ac80828596bc';
const SUI_HASUI_VAULT_ID =
  '0xde97452e63505df696440f86f0b805263d8659b77b8c316739106009d514c270';
const POINT_CENTER_ID =
  '0xc60fb4131a47aa52ac27fe5b6f9613ffe27832c5f52d27755511039d53908217';

const AF_LP_IDs = [
  '0xe2569ee20149c2909f0f6527c210bc9d97047fe948d34737de5420fab2db7062',
  '0x885e09419b395fcf5c8ee5e2b7c77e23b590e58ef3d61260b6b4eb44bbcc8c62',
];

const AF_POOL_IDs = [
  '0xdeacf7ab460385d4bcb567f183f916367f7d43666a2c72323013822eb3c57026',
  '0xeec6b5fb1ddbbe2eb1bdcd185a75a8e67f52a5295704dd73f3e447394775402b',
];

const AFSUI_SUI_LP_ID =
  '0x97aae7a80abb29c9feabbe7075028550230401ffe7fb745757d3c28a30437408';
const AFSUI_SUI_LP_BUCKET_ID =
  '0x1e88892e746708ec69784a56c6aba301a97e87e5b77aaef0eec16c3e472e8653';

const KRIYA_LP_IDS = [
  '0xcc39bcc2c438a79beb2656ff043714a60baf89ba37592bef2e14ee8bca0cf007',
  '0xae1910e5bcb13a4f5b12688f0da939b9c9d3e8a9e8d0a2e02c818f6a94e598fd',
];

const KRIYA_POOL_IDs = [
  '0x3c334f9d1b969767007d26bc886786f9f197ffb14771f7903cd8772c46d08dea',
  '0xbb4a712b3353176092cdfe3dd2d1251b725f9372e954248e5dd2eb2ab6a5f21a',
];

const CETUS_LP_ID =
  '0xb9d46d57d933fabaf9c81f4fc6f54f9c1570d3ef49785c6b7200cad6fe302909';

const USDC_CIRCLE_PSM =
  '0xd22388010d7bdb9f02f14805a279322a3fa3fbde42896b7fb3d1214af404c455';
const USDC_PSM =
  '0x0c2e5fbfeb5caa4c2f7c8645ffe9eca7e3c783536efef859be03146b235f9e04';
const USDT_PSM =
  '0x607e7d386e29066b964934e0eb1daa084538a79b5707c34f38e190d64e24923e';
const FDUSD_PSM =
  '0xb23092f74b7bbea45056d8564a7325be993cc2926b89f384367b9ad309dd92c5';
const BUCKETUS_PSM =
  '0xba86a0f37377844f38060a9f62b5c5cd3f8ba13901fa6c4ee5777c1cc535306b';
const BLUEFIN_STABLE_LP_PSM =
  '0x27c3ec824df70520cb3cf9592049506167e8094a779a680b83b987519e3895b6';
const CETABLE_PSM =
  '0x6e94fe6910747a30e52addf446f2d7e844f69bf39eced6bed03441e01fa66acd';
const STAPEARL_PSM =
  '0xccdaf635eb1c419dc5ab813cc64c728a9f5a851202769e254f348bff51f9a6dc';

const afSUI_sLP_ID =
  '0x508da82c0b6785653f638b95ebf7c89d720ecffae15c4d0526228a2edae7d429';
const vSUI_sLP_ID =
  '0xa68124b518290f430f2133bcb679c519e51c99045e622cd6bcb00374c97f6d9d';
const haSUI_sLP_ID =
  '0xa8993bf1c1e717b7c0f164c51346fa99a4e771c50d90c14e755adc48e39b7768';
const navi_sLP_ID =
  '0xcbe804c8c334dcadecd4ba05ee10cffa54dad36f279ab4ec9661d67f9372881c';
const navi_stSUI_sLP_ID =
  '0xd3f6b8f3c92d8f967f7e177e836770421e351b419ffe074ce57911365b4ede56';
const navi_sbWBTC_LP_ID =
  '0x208628e8800828b272dfc4cf40ef98e1ba137f65d26a28961176a1718c2bdb4c';
const scallop_sUSDC_LP_ID =
  '0x7b16192d63e6fa111b0dac03f99c5ff965205455089f846804c10b10be55983c';
const scallop_sUSDT_LP_ID =
  '0x6b68b42cbb4efccd9df30466c21fff3c090279992c005c45154bd1a0d87ac725';
const scallop_sCircleUSDC_LP_ID =
  '0xdf91ef19f6038e662e9c89f111ffe19e808cdfb891d080208d15141932f9513b';
const scallop_sSuiBridgeUSDT_LP_ID =
  '0x8471787fc69ef06f4762cb60863e1c48475d79c804a000e613306adee7b7824a';
const navi_sCircleUSDC_LP_ID =
  '0xb5ed3f2e5c19f425baad3d9a0afffdc84d0550ace2372692cf93325da81e4392';
const navi_sSuiBridgeUSDT_LP_ID =
  '0x4ae310b93c65e358b6f8beb73f34d0ac7d507947d8aea404159d19883a3b1c6a';
const navi_fdUSD_LP_ID =
  '0xa2790bbd90275e35214bffd8da3c01742bb5883fde861bf566a9ecfa1b3f5090';
const haSUI_Navi_Pond_ID =
  '0xef1ff1334c1757d8e841035090d34b17b7aa3d491a3cb611319209169617518e';
const SUI_Navi_Pond_ID =
  '0xcf887d7201c259496a191348da86b4772a2e2ae3f798ca50d1247194e30b7656';

const HASUI =
  '0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI';
const GSUI =
  '0x2f2226a22ebeb7a0e63ea39551829b238589d981d1c6dd454f01fcc513035593::house::StakedHouseCoin<0x2::sui::SUI>';
const GUPUSD =
  '0x2f2226a22ebeb7a0e63ea39551829b238589d981d1c6dd454f01fcc513035593::house::StakedHouseCoin<0x5de877a152233bdd59c7269e2b710376ca271671e9dd11076b1ff261b2fd113c::up_usd::UP_USD>';
const SCA_ADDRESS =
  '0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA';
const SUI_HASUI_CETUS_VAULT_LP_ADDRESS =
  '0x828b452d2aa239d48e4120c24f4a59f451b8cd8ac76706129f4ac3bd78ac8809::lp_token::LP_TOKEN';

async function calculateGSUIunderlyingSui(
  gSuiAmount: string,
  web3: any,
): Promise<string> {
  try {
    const gsuiObject = await web3.getObject(
      '0x811fe901ed2a5d75cd125912ad6110efdff8be00fe694601a94167e2bd545ac2',
    );

    const poolBN = new BigNumber(gsuiObject.fields.pool);
    const pipeBN = new BigNumber(gsuiObject.fields.pipe_debt.fields.value);
    const supplyBN = new BigNumber(gsuiObject.fields.supply.fields.value);
    const gSuiAmountBN = new BigNumber(gSuiAmount);

    const percentage = poolBN.plus(pipeBN).dividedBy(supplyBN);
    const result = percentage.multipliedBy(gSuiAmountBN);

    return result.integerValue().toString();
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error calculating GSUI underlying SUI',
      endpoint: 'calculateGSUIunderlyingSui',
    });
    return '0';
  }
}

async function calculateGUPUSDunderlyingUSD(
  gUpusdAmount: string,
  web3: any,
): Promise<string> {
  try {
    const gupusdObject = await web3.getObject(
      '0x13766a4d5c180f004f9bfd19e65f622fbb2b9498736131b948599054c0129f42',
    );

    const poolBN = new BigNumber(gupusdObject.fields.pool);
    const pipeBN = new BigNumber(gupusdObject.fields.pipe_debt.fields.value);
    const supplyBN = new BigNumber(gupusdObject.fields.supply.fields.value);
    const gUpusdAmountBN = new BigNumber(gUpusdAmount);

    const percentage = poolBN.plus(pipeBN).dividedBy(supplyBN);
    const result = percentage.multipliedBy(gUpusdAmountBN);

    return result.integerValue().toString();
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error calculating GUPUSD underlying USD',
      endpoint: 'calculateGUPUSDunderlyingUSD',
    });
    return '0';
  }
}

async function calculatehaSuiSuiVaultShares(
  balances: { [key: string]: string },
  token0: string,
  token1: string,
  lpAmount: string,
  web3: any,
): Promise<void> {
  try {
    const suiHasuiPool = await web3.getObject(SUI_HASUI_POOL_ID);

    const vaultObject = await web3.getObject(SUI_HASUI_VAULT_ID);

    const lpSupply =
      vaultObject.fields.lp_token_treasury.fields.total_supply.fields.value;
    const lpSupplyBN = new BigNumber(lpSupply);
    const lpAmountBN = new BigNumber(lpAmount);
    const lpRatio = lpAmountBN.dividedBy(lpSupplyBN);

    const clmmPosition =
      vaultObject.fields.positions[0].fields.clmm_postion.fields;
    const liquidityBN = new BigNumber(clmmPosition.liquidity);
    const calculatedLiquidity = liquidityBN.multipliedBy(lpRatio);

    const currentSqrtPriceBN = new BigNumber(
      suiHasuiPool.fields.current_sqrt_price,
    );
    const tick = Math.floor(
      Math.log(
        Math.pow(currentSqrtPriceBN.dividedBy(Math.pow(2, 64)).toNumber(), 2),
      ) / Math.log(1.0001),
    );

    const tickLower = Number(clmmPosition.tick_lower_index.fields.bits);
    const tickUpper = Number(clmmPosition.tick_upper_index.fields.bits);

    web3.addUniV3LikePosition(
      balances,
      token0,
      token1,
      calculatedLiquidity.integerValue().toString(),
      tickLower,
      tickUpper,
      tick,
    );
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error calculating haSUI-SUI vault shares',
      endpoint: 'calculatehaSuiSuiVaultShares',
    });
  }
}

async function getStakingLPAmount(web3: any, id: string): Promise<string> {
  try {
    const stakingLPObject = await web3.getObject(id);
    return stakingLPObject.output_volume;
  } catch (error) {
    return '0';
  }
}

async function getScallopsLPAmount(web3: any, id: string): Promise<string> {
  try {
    const stakingLPObject = await web3.getObject(id);
    return stakingLPObject.coin_balance || stakingLPObject.fields?.coin_balance;
  } catch (error) {
    return '0';
  }
}

async function getNaviLPAmount(web3: any, id: string): Promise<string> {
  try {
    const stakingLPObject = await web3.getObject(id);
    return stakingLPObject.coin_balance || stakingLPObject.fields?.coin_balance;
  } catch (error) {
    return '0';
  }
}

function convertUnderlyingAssets(coin: string): string {
  const SCALLOP_MAPPINGS: { [key: string]: string } = {
    '0xad4d71551d31092230db1fd482008ea42867dbf27b286e9c70a79d2a6191d58d::scallop_wormhole_usdc::SCALLOP_WORMHOLE_USDC':
      suiTokens.USDC_WORMHOLE,
    '0x854950aa624b1df59fe64e630b2ba7c550642e9342267a33061d59fb31582da5::scallop_usdc::SCALLOP_USDC':
      suiTokens.USDC_CIRCLE,
    '0xe6e5a012ec20a49a3d1d57bd2b67140b96cd4d3400b9d79e541f7bdbab661f95::scallop_wormhole_usdt::SCALLOP_WORMHOLE_USDT':
      suiTokens.USDT,
    '0xaafc4f740de0dd0dde642a31148fb94517087052f19afb0f7bed1dc41a50c77b::scallop_sui::SCALLOP_SUI':
      suiTokens.SUI,
    '0xb14f82d8506d139eacef109688d1b71e7236bcce9b2c0ad526abcd6aa5be7de0::scallop_sb_eth::SCALLOP_SB_ETH':
      suiTokens.ETH,
    '0x5ca17430c1d046fae9edeaa8fd76c7b4193a00d764a0ecfa9418d733ad27bc1e::scallop_sca::SCALLOP_SCA':
      SCA_ADDRESS,
    '0xeb7a05a3224837c5e5503575aed0be73c091d1ce5e43aa3c3e716e0ae614608f::scallop_deep::SCALLOP_DEEP':
      suiTokens.DEEP,
    '0xb1d7df34829d1513b73ba17cb7ad90c88d1e104bb65ab8f62f13e0cc103783d3::scallop_sb_usdt::SCALLOP_SB_USDT':
      suiTokens.suiUSDT,
  };

  return SCALLOP_MAPPINGS[coin] || coin;
}

async function getCdpBalances(web3: any): Promise<{ [key: string]: string }> {
  const balances: { [key: string]: string } = {};

  try {
    const protocolFields = await web3.getDynamicFieldObjects({
      parent: MAINNET_PROTOCOL_ID,
    });

    const aflpObjs = await web3.getObjects(AF_LP_IDs);
    const aflStakedList = aflpObjs.map((aflp: any) => aflp.fields.staked);

    const buckAfPoolData = await web3.getObjects(AF_POOL_IDs);

    const kriyalpObjs = await web3.getObjects(KRIYA_LP_IDS);
    const kriyaStakedList = kriyalpObjs.map(
      (kriyalp: any) => kriyalp.fields.staked.fields.lsp.fields.balance,
    );

    const kriyalpPoolData = await web3.getObjects(KRIYA_POOL_IDs);

    const [
      afsuiSuiLpObj,
      afsuiSuiLpBucket,
      cetusLpObj,
      usdcCirclePSMObj,
      fdusdPSMObj,
      usdcPSMObj,
      usdtPSMObj,
      bucketusPSMObj,
      cetablePSMObj,
      stapearlPSMObj,
      bluefinStableLpObj,
    ] = await web3.getObjects([
      AFSUI_SUI_LP_ID,
      AFSUI_SUI_LP_BUCKET_ID,
      CETUS_LP_ID,
      USDC_CIRCLE_PSM,
      FDUSD_PSM,
      USDC_PSM,
      USDT_PSM,
      BUCKETUS_PSM,
      CETABLE_PSM,
      STAPEARL_PSM,
      BLUEFIN_STABLE_LP_PSM,
    ]);

    const afsuiSuiTokenNames = afsuiSuiLpObj.fields.type_names;
    const afsuiSuiLpBucketStaked = afsuiSuiLpBucket.fields.collateral_vault;
    const stakedBucketus = cetusLpObj.fields.staked;
    const usdcCirclePSMAmount = usdcCirclePSMObj.fields.pool;
    const fdusdPSMAmount = fdusdPSMObj.fields.pool;
    const usdcPSMAmount = usdcPSMObj.fields.pool;
    const usdtPSMAmount = usdtPSMObj.fields.pool;
    const bucketusPSMAmount = bucketusPSMObj.fields.pool;
    const bluefinStableLpPSMAmount = bluefinStableLpObj.fields.pool;
    const cetablePSMAmount = cetablePSMObj.fields.pool;
    const stapearlPSMAmount = stapearlPSMObj.fields.pool;

    const bucketList = protocolFields.filter(
      (item: any) => item.type && item.type.includes('Bucket'),
    );

    for (const bucket of bucketList) {
      if (bucket.type.includes('AF_LP')) continue;

      const coin_address = bucket.type.slice(
        bucket.type.indexOf('<') + 1,
        bucket.type.lastIndexOf('>'),
      );
      const coin = convertUnderlyingAssets(coin_address);

      if (coin === SUI_HASUI_CETUS_VAULT_LP_ADDRESS) {
        await calculatehaSuiSuiVaultShares(
          balances,
          HASUI,
          suiTokens.SUI,
          bucket.fields.collateral_vault,
          web3,
        );
      } else if (coin === GSUI) {
        const suiAmount = await calculateGSUIunderlyingSui(
          bucket.fields.collateral_vault,
          web3,
        );
        formatter.merge(balances, suiTokens.SUI, suiAmount);
      } else if (coin === GUPUSD) {
        const usdAmount = await calculateGUPUSDunderlyingUSD(
          bucket.fields.collateral_vault,
          web3,
        );
        formatter.merge(balances, suiTokens.USDC_WORMHOLE, usdAmount);
      } else {
        if (coin)
          formatter.merge(balances, coin, bucket.fields.collateral_vault);
      }
    }

    for (const [index, poolData] of buckAfPoolData.entries()) {
      const {
        fields: {
          type_names: tokens,
          normalized_balances: bals,
          lp_supply,
          decimal_scalars,
        },
      } = poolData;

      bals.forEach((v: string, i: number) => {
        const value = Math.floor(
          (Number(v) * Number(aflStakedList[index])) /
            Number(lp_supply.fields.value) /
            Number(decimal_scalars[i]),
        );
        const token = '0x' + tokens[i];
        if (token !== suiTokens.BUCK) {
          formatter.merge(balances, token, value.toString());
        }
      });
    }

    for (const [index, poolData] of kriyalpPoolData.entries()) {
      const {
        type,
        fields: { lsp_supply, token_x, token_y },
      } = poolData;

      const tokens = type.split('<').pop()?.replace('>', '')?.split(',') ?? [];
      const x = tokens[0].trim();
      const y = tokens[1].trim();

      const xVal = Math.floor(
        (Number(token_x) * Number(kriyaStakedList[index])) /
          Number(lsp_supply.fields.value),
      );
      const yVal = Math.floor(
        (Number(token_y) * Number(kriyaStakedList[index])) /
          Number(lsp_supply.fields.value),
      );

      if (x !== suiTokens.BUCK) formatter.merge(balances, x, xVal.toString());
      if (y !== suiTokens.BUCK) formatter.merge(balances, y, yVal.toString());
    }

    const halfStakedBucketus = Math.floor(Number(stakedBucketus) / 2);
    formatter.merge(
      balances,
      suiTokens.USDC_WORMHOLE,
      Math.floor(halfStakedBucketus / 1000).toString(),
    );

    formatter.merge(
      balances,
      suiTokens.USDC_CIRCLE,
      Math.floor(Number(usdcCirclePSMAmount)).toString(),
    );
    formatter.merge(
      balances,
      suiTokens.USDC_WORMHOLE,
      Math.floor(Number(usdcPSMAmount)).toString(),
    );
    formatter.merge(
      balances,
      suiTokens.USDT,
      Math.floor(Number(usdtPSMAmount)).toString(),
    );
    formatter.merge(
      balances,
      suiTokens.FDUSD,
      Math.floor(Number(fdusdPSMAmount)).toString(),
    );

    const halfCetableAmount = Math.floor(Number(cetablePSMAmount) / 2);
    formatter.merge(
      balances,
      suiTokens.USDC_WORMHOLE,
      Math.floor(halfCetableAmount).toString(),
    );
    formatter.merge(
      balances,
      suiTokens.USDT,
      Math.floor(halfCetableAmount).toString(),
    );

    const halfStapearlAmount = Math.floor(Number(stapearlPSMAmount) / 2);
    formatter.merge(
      balances,
      suiTokens.USDC_WORMHOLE,
      Math.floor(halfStapearlAmount).toString(),
    );
    formatter.merge(
      balances,
      suiTokens.USDT,
      Math.floor(halfStapearlAmount).toString(),
    );

    const halfBucketusAmount = Math.floor(Number(bucketusPSMAmount) / 2);
    formatter.merge(
      balances,
      suiTokens.USDC_WORMHOLE,
      Math.floor(halfBucketusAmount / 1000).toString(),
    );

    const halfBluefinStableLPAmount = Math.floor(
      Number(bluefinStableLpPSMAmount) / 2,
    );
    formatter.merge(
      balances,
      suiTokens.USDC_WORMHOLE,
      Math.floor(halfBluefinStableLPAmount / 1000).toString(),
    );

    const afsuiSuiLpSupply = afsuiSuiLpObj.fields.lp_supply.fields.value;
    const afsuiSuiLpBalances = afsuiSuiLpObj.fields.normalized_balances;
    const suiTotalAmount = Math.floor(Number(afsuiSuiLpBalances[0]) / 10 ** 18);
    const afsuiTotalAmount = Math.floor(
      Number(afsuiSuiLpBalances[1]) / 10 ** 18,
    );

    const suiPercentage = Math.floor(suiTotalAmount / Number(afsuiSuiLpSupply));
    const afsuiPercentage = Math.floor(
      afsuiTotalAmount / Number(afsuiSuiLpSupply),
    );

    formatter.merge(
      balances,
      `0x${afsuiSuiTokenNames[0]}`,
      Math.floor(suiPercentage * Number(afsuiSuiLpBucketStaked)).toString(),
    );
    formatter.merge(
      balances,
      `0x${afsuiSuiTokenNames[1]}`,
      Math.floor(afsuiPercentage * Number(afsuiSuiLpBucketStaked)).toString(),
    );

    const safSUILPAmount = await getStakingLPAmount(web3, afSUI_sLP_ID);
    formatter.merge(
      balances,
      '0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc::afsui::AFSUI',
      safSUILPAmount,
    );

    const svSUILPAmount = await getStakingLPAmount(web3, vSUI_sLP_ID);
    formatter.merge(
      balances,
      '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT',
      svSUILPAmount,
    );

    const shaSUILPAmount = await getStakingLPAmount(web3, haSUI_sLP_ID);
    formatter.merge(balances, HASUI, shaSUILPAmount);

    const snaviLPAmount = await getStakingLPAmount(web3, navi_sLP_ID);
    formatter.merge(
      balances,
      '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT',
      snaviLPAmount,
    );

    const snavistSUILPAmount = await getStakingLPAmount(
      web3,
      navi_stSUI_sLP_ID,
    );
    formatter.merge(
      balances,
      '0xd1b72982e40348d069bb1ff701e634c117bb5f741f44dff91e472d3b01461e55::stsui::STSUI',
      snavistSUILPAmount,
    );

    const snavisbWBTCLPAmount = await getStakingLPAmount(
      web3,
      navi_sbWBTC_LP_ID,
    );
    formatter.merge(balances, suiTokens.WBTC, snavisbWBTCLPAmount);

    const haSuiNaviPondAmount = await getStakingLPAmount(
      web3,
      haSUI_Navi_Pond_ID,
    );
    formatter.merge(balances, HASUI, haSuiNaviPondAmount);

    const suiNaviPondAmount = await getStakingLPAmount(web3, SUI_Navi_Pond_ID);
    formatter.merge(balances, suiTokens.SUI, suiNaviPondAmount);

    const scallopUSDC_LPAmount = await getScallopsLPAmount(
      web3,
      scallop_sUSDC_LP_ID,
    );
    formatter.merge(balances, suiTokens.USDC_WORMHOLE, scallopUSDC_LPAmount);

    const scallopUSDT_LPAmount = await getScallopsLPAmount(
      web3,
      scallop_sUSDT_LP_ID,
    );
    formatter.merge(balances, suiTokens.USDT, scallopUSDT_LPAmount);

    const scallopCircleUSDC_LPAmount = await getScallopsLPAmount(
      web3,
      scallop_sCircleUSDC_LP_ID,
    );
    formatter.merge(
      balances,
      suiTokens.USDC_CIRCLE,
      scallopCircleUSDC_LPAmount,
    );

    const scallopSuiBridgeUSDT_LPAmount = await getScallopsLPAmount(
      web3,
      scallop_sSuiBridgeUSDT_LP_ID,
    );
    formatter.merge(balances, suiTokens.suiUSDT, scallopSuiBridgeUSDT_LPAmount);

    const naviCircleUSDC_LPAmount = await getNaviLPAmount(
      web3,
      navi_sCircleUSDC_LP_ID,
    );
    formatter.merge(balances, suiTokens.USDC_CIRCLE, naviCircleUSDC_LPAmount);

    const naviSuiBridgeUSDT_LPAmount = await getNaviLPAmount(
      web3,
      navi_sSuiBridgeUSDT_LP_ID,
    );
    formatter.merge(balances, suiTokens.suiUSDT, naviSuiBridgeUSDT_LPAmount);

    const naviFDUSD_LPAmount = await getNaviLPAmount(web3, navi_fdUSD_LP_ID);
    formatter.merge(balances, suiTokens.FDUSD, naviFDUSD_LPAmount);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching CDP balances from Bucket protocol',
      endpoint: 'getCdpBalances',
    });
  }

  return balances;
}

async function getFarmBalances(web3: any): Promise<{ [key: string]: string }> {
  const balances: { [key: string]: string } = {};

  try {
    const pointCenter = await web3.getObject(POINT_CENTER_ID);
    const poolStates = pointCenter.pool_states.fields.contents.map(
      (state: any) => {
        const value = state.fields.value.fields;
        return {
          assetType: '0x' + value.asset_type,
          totalStake: value.total_stake,
        };
      },
    );

    for (const poolState of poolStates) {
      let assetType = poolState.assetType;
      if (
        assetType ===
          '0x922d15d7f55c13fd790f6e54397470ec592caa2b508df292a2e8553f3d3b274f::msui::MSUI' ||
        assetType ===
          '0x41ff228bfd566f0c707173ee6413962a77e3929588d010250e4e76f0d1cc0ad4::ksui::KSUI' ||
        assetType ===
          '0xd1b72982e40348d069bb1ff701e634c117bb5f741f44dff91e472d3b01461e55::stsui::STSUI' ||
        assetType ===
          '0xfbdd50dd7bc7af482d308f8c5d8c66c23e3b59494ff92f2947b150f20b5f43fd::af_lp::AF_LP'
      ) {
        assetType = suiTokens.SUI;
      }
      formatter.merge(balances, assetType, poolState.totalStake);
    }
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching farm balances from Bucket protocol',
      endpoint: 'getFarmBalances',
    });
  }

  return balances;
}

function parseTypeTag(type: string): any {
  if (!type.includes('::')) return type;
  return parseStructTag(type);
}

function splitGenericParameters(
  str: string,
  genericSeparators: string[] = ['<', '>'],
): string[] {
  const [left, right] = genericSeparators;
  const tok: string[] = [];
  let word = '';
  let nestedAngleBrackets = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === left) {
      nestedAngleBrackets++;
    }
    if (char === right) {
      nestedAngleBrackets--;
    }
    if (nestedAngleBrackets === 0 && char === ',') {
      tok.push(word.trim());
      word = '';
      continue;
    }
    word += char;
  }

  tok.push(word.trim());
  return tok;
}

function normalizeSuiAddress(value: string, forceAdd0x = false): string {
  let address = value.toLowerCase();
  if (!forceAdd0x && address.startsWith('0x')) {
    address = address.slice(2);
  }
  return `0x${address.padStart(32 * 2, '0')}`;
}

function parseStructTag(type: string): any {
  const [address, module] = type.split('::');
  const rest = type.slice(address.length + module.length + 4);
  const name = rest.includes('<') ? rest.slice(0, rest.indexOf('<')) : rest;
  const typeParams = rest.includes('<')
    ? splitGenericParameters(
        rest.slice(rest.indexOf('<') + 1, rest.lastIndexOf('>')),
      ).map((typeParam) => parseTypeTag(typeParam.trim()))
    : [];

  return {
    address: normalizeSuiAddress(address),
    module,
    name,
    typeParams,
  };
}

function normalizeStructTag(type: any): string {
  const { address, module, name, typeParams } =
    typeof type === 'string' ? parseStructTag(type) : type;

  const formattedTypeParams =
    typeParams?.length > 0
      ? `<${typeParams
          .map((typeParam: any) =>
            typeof typeParam === 'string'
              ? typeParam
              : normalizeStructTag(typeParam),
          )
          .join(',')}>`
      : '';

  return `${address}::${module}::${name}${formattedTypeParams}`;
}

async function getAllVaultIds(web3: any): Promise<{ [key: string]: string }> {
  const newVaultEventType =
    '0x9f835c21d21f8ce519fec17d679cd38243ef2643ad879e7048ba77374be4036e::events::VaultCreated';
  const res = await web3.queryEvents({ eventType: newVaultEventType });

  const collTypes = res.map((d: any) => normalizeStructTag(d.coll_type));
  const vaultIds = res.map((d: any) => d.vault_id);
  const vaultRes = await web3.getObjects(vaultIds);

  return vaultRes.reduce((acc: any, vault: any, idx: number) => {
    if (collTypes[idx]) {
      acc[collTypes[idx]] = vault.fields.id.id;
    }
    return acc;
  }, {});
}

async function getAllPoolIds(web3: any): Promise<{ [key: string]: string }> {
  const newPSMPoolEventType =
    '0xc2ae6693383e4a81285136effc8190c7baaf0e75aafa36d1c69cd2170cfc3803::events::NewPsmPool';
  const res = await web3.queryEvents({ eventType: newPSMPoolEventType });

  const collTypes = res.map((d: any) => normalizeStructTag(d.coin_type));
  const poolIds = res.map((d: any) => d.pool_id);
  const poolRes = await web3.getObjects(poolIds);

  return poolRes.reduce((acc: any, pool: any, idx: number) => {
    if (collTypes[idx]) {
      acc[collTypes[idx]] = pool.fields.id.id;
    }
    return acc;
  }, {});
}

function mappingTokenAsset(type: string): string {
  switch (type) {
    case '0x2f2226a22ebeb7a0e63ea39551829b238589d981d1c6dd454f01fcc513035593::house::StakedHouseCoin<0x5de877a152233bdd59c7269e2b710376ca271671e9dd11076b1ff261b2fd113c::up_usd::UP_USD>':
      return suiTokens.USDC_WORMHOLE;
    case '0x2f2226a22ebeb7a0e63ea39551829b238589d981d1c6dd454f01fcc513035593::house::StakedHouseCoin<0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI>':
      return suiTokens.SUI;
    case '0xb14f82d8506d139eacef109688d1b71e7236bcce9b2c0ad526abcd6aa5be7de0::scallop_sb_eth::SCALLOP_SB_ETH':
      return suiTokens.ETH;
    case '0xeb7a05a3224837c5e5503575aed0be73c091d1ce5e43aa3c3e716e0ae614608f::scallop_deep::SCALLOP_DEEP':
      return suiTokens.DEEP;
    case '0x622345b3f80ea5947567760eec7b9639d0582adcfd6ab9fccb85437aeda7c0d0::scallop_wal::SCALLOP_WAL':
      return suiTokens.WAL;
    case '0xb1d7df34829d1513b73ba17cb7ad90c88d1e104bb65ab8f62f13e0cc103783d3::scallop_sb_usdt::SCALLOP_SB_USDT':
      return suiTokens.USDT;
    case '0x854950aa624b1df59fe64e630b2ba7c550642e9342267a33061d59fb31582da5::scallop_usdc::SCALLOP_USDC':
      return suiTokens.USDC_CIRCLE;
    case '0xaafc4f740de0dd0dde642a31148fb94517087052f19afb0f7bed1dc41a50c77b::scallop_sui::SCALLOP_SUI':
      return suiTokens.SUI;
    case '0x876a4b7bce8aeaef60464c11f4026903e9afacab79b9b142686158aa86560b50::xbtc::XBTC':
      return suiTokens.BTC;
    default:
      return type;
  }
}

async function getProtocolBalances(
  web3: any,
): Promise<{ [key: string]: string }> {
  const balances: { [key: string]: string } = {};

  try {
    const vaultIds = await getAllVaultIds(web3);
    const cdpCollateralTypes = Object.keys(vaultIds);

    for (const collateralType of cdpCollateralTypes) {
      const id = vaultIds[collateralType];
      const vaultObject = await web3.getObject(id);
      console.log('Vault Object:', JSON.stringify(vaultObject, null, 2));

      formatter.merge(
        balances,
        mappingTokenAsset(collateralType),
        vaultObject.total_coll_amount,
      );
    }

    const poolIds = await getAllPoolIds(web3);
    const psmCoinTypes = Object.keys(poolIds);

    for (const collateralType of psmCoinTypes) {
      const poolId = poolIds[collateralType];
      const poolObject = await web3.getObject(poolId);
      console.log('Pool Object:', JSON.stringify(poolObject, null, 2));

      formatter.merge(
        balances,
        mappingTokenAsset(collateralType),
        poolObject.balance_amount,
      );
    }
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching protocol balances',
      endpoint: 'getProtocolBalances',
    });
  }

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  let balances = {};

  try {
    const farmBalances = await getFarmBalances(web3);
    balances = formatter.sum([balances, farmBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching farm balances',
      endpoint: 'tvl',
    });
  }

  try {
    const protocolBalances = await getProtocolBalances(web3);
    balances = formatter.sum([balances, protocolBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching protocol balances',
      endpoint: 'tvl',
    });
  }

  try {
    const cdpBalances = await getCdpBalances(web3);
    balances = formatter.sum([balances, cdpBalances]);
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching Bucket protocol TVL',
      endpoint: 'tvl',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);

  return { balances };
}

export { tvl };
