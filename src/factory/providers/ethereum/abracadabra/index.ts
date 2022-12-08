import BigNumber from 'bignumber.js';
import ABI from './abis/abi.json';
import WSOHM_ABI from './abis/wsOHM.json';
import MINTER256_ABI from './abis/minter256.json';
import MINTER128_ABI from './abis/minter128.json';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import chainWeb3 from '../../../../web3Provider/chainWeb3';
import util from '../../../../util/blockchainUtil';

const CAULDRON_CONTRACTS = [
  '0x7b7473a76d6ae86ce19f7352a1e89f6c9dc39020',
  '0x05500e2ee779329698df35760bedcaac046e7c27',
  '0x003d5a75d284824af736df51933be522de9eed0f',
  '0x98a84eff6e008c5ed0289655ccdca899bcb6b99f',
  '0xebfde87310dc22404d918058faa4d56dc4e93f0a',
  '0x0bca8ebcb26502b013493bf8fe53aa2b1ed401c1',
  '0x920d9bd936da4eafb5e25c6bdc9f6cb528953f9f',
  '0x4eaed76c3a388f4a841e9c765560bbe7b3e4b3a0',
  '0x252dcf1b621cc53bc22c256255d2be5c8c32eae4',
  '0x35a0dd182e4bca59d5931eae13d0a2332fa30321',
  '0xc1879bf24917ebe531fbaa20b0d05da027b592ce',
  '0x9617b633ef905860d919b88e1d9d9a6191795341',
  '0xcfc571f3203756319c231d3bc643cee807e74636',
  '0x3410297d89dcdaf4072b805efc1ef701bb3dd9bf',
  '0x59e9082e068ddb27fc5ef1690f9a9f22b32e573f',
  '0x257101f20cb7243e2c7129773ed5dbbcef8b34e0',
  '0x390db10e65b5ab920c19149c919d970ad9d18a41',
  '0x6cbafee1fab76ca5b5e144c43b3b50d42b7c8c8f',
  '0x551a7cff4de931f32893c928bbc3d25bf1fc5147',
  '0x6ff9061bb8f97d948942cef376d98b51fa38b91f',
  '0xbb02a884621fb8f5bfd263a67f58b65df5b090f3',
  '0xc319eea1e792577c319723b5e60a15da3857e7da',
  '0xffbf4892822e0d552cff317f65e1ee7b5d3d9ae6',
  '0x806e16ec797c69afa8590a55723ce4cc1b54050e',
  '0x6371efe5cd6e3d2d7c477935b7669401143b7985',
  '0xbc36fde44a7fd8f545d459452ef9539d7a14dd63',
];
const WSOHM_ADDRESS = '0xca76543cf381ebbb277be79574059e32108e3e65';
const OHM_ADDRESS = '0x383518188c0c6d7730d91b2c03a03c837814a899';
const UNDERLYINGS = {
  '0x26fa3fffb6efe8c1e69103acb4044c26b9a106a9':
    '0x090185f2135308bad17527004364ebcc2d37e5f6',
  '0x5f18c75abdae578b483e5f43f12a39cf75b973a9':
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  '0x7da96a3891add058ada2e826306d812c638d87a7':
    '0xdac17f958d2ee523a2206206994597c13d831ec7',
  '0xa9fe4601811213c340e850ea305481aff02f5b28':
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  '0xe14d13d8b3b85af791b2aadd661cdbd5e6097db1':
    '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
  '0x27b7b1ad7288079a66d12350c828d3c00a6f07d7':
    '0x5282a4ef67d9c33135340fb3289cc1711c13638c',
  '0xdcd90c7f6324cfa40d7169ef80b12031770b4325':
    '0x06325440d014e39736583c165c2963ba99faf14e',
  '0xa258c4606ca8206d8aa700ce2143d7db854d168c':
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
};
const STK_TOKENS = [
  {
    STKCVXCRV3CRYPTO_ABRA: '0x5958a8db7dfe0cc49382209069b00f54e17929c2',
    CRV3CRYPTO: '0xc4ad29ba4b3c580e6d59105fff484999997675ff',
    MINTER: '0xd51a44d3fae010294c616388b506acda1bfaae46',
    COINS: [
      '0xdac17f958d2ee523a2206206994597c13d831ec7',
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    ],
    type: 256,
  },
  {
    STKCVXCRV3CRYPTO_ABRA: '0xb65ede134521f0efd4e943c835f450137dc6e83e',
    CRV3CRYPTO: '0x49849c98ae39fff122806c06791fa73784fb3675',
    MINTER: '0x93054188d876f558f4a66b2ef1d97d16edf0895b',
    COINS: [
      '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d',
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    ],
    type: 128,
  },
  {
    STKCVXCRV3CRYPTO_ABRA: '0x3ba207c25a278524e1cc7faaea950753049072a4',
    CRV3CRYPTO: '0x6c3f90f043a72fa612cbac8115ee7e52bde6e490',
    MINTER: '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
    COINS: [
      '0x6b175474e89094c44da98b954eedeac495271d0f',
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      '0xdac17f958d2ee523a2206206994597c13d831ec7',
    ],
    type: 256,
  },
  {
    STKCVXCRV3CRYPTO_ABRA: '0xd92494cb921e5c0d3a39ea88d0147bbd82e51008',
    CRV3CRYPTO: '0x6c3f90f043a72fa612cbac8115ee7e52bde6e490',
    MINTER: '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
    COINS: [
      '0x6b175474e89094c44da98b954eedeac495271d0f',
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      '0xdac17f958d2ee523a2206206994597c13d831ec7',
    ],
    type: 256,
  },
];

/*==================================================
TVL
==================================================*/

async function tvl(params) {
  const { block, chain } = params;

  if (block < 12454535) {
    return {};
  }

  const web3 = chainWeb3.getWeb3(chain);

  const tokenBalances = {};
  const results = await util.executeCallOfMultiTargets(
    CAULDRON_CONTRACTS,
    ABI,
    'totalCollateralShare',
    [],
    block,
    chain,
  );
  const tokenAddresses = await util.executeCallOfMultiTargets(
    CAULDRON_CONTRACTS,
    ABI,
    'collateral',
    [],
    block,
    chain,
  );

  results.forEach((result, index) => {
    const balance = BigNumber(result || 0);
    if (balance.isGreaterThan(0)) {
      const token = tokenAddresses[index].toLowerCase();
      if (tokenBalances[token]) {
        tokenBalances[token] = tokenBalances[token].plus(balance);
      } else {
        tokenBalances[token] = balance;
      }
    }
  });

  const balances = await util.convertToUnderlyings(tokenBalances, block, chain);

  if (balances[WSOHM_ADDRESS]) {
    try {
      const wsOHMContract = new web3.eth.Contract(WSOHM_ABI, WSOHM_ADDRESS);
      const ohmBalance = await wsOHMContract.methods
        .wOHMTosOHM(balances[WSOHM_ADDRESS])
        .call(null, block);
      delete balances[WSOHM_ADDRESS];
      balances[OHM_ADDRESS] = BigNumber(balances[OHM_ADDRESS] || 0)
        .plus(ohmBalance)
        .toFixed();
    } catch {}
  }

  for (const stkToken of STK_TOKENS) {
    if (balances[stkToken.STKCVXCRV3CRYPTO_ABRA]) {
      try {
        const contract = new web3.eth.Contract(ERC20_ABI, stkToken.CRV3CRYPTO);
        const minterContract = new web3.eth.Contract(
          stkToken.type == 256 ? MINTER256_ABI : MINTER128_ABI,
          stkToken.MINTER,
        );
        const totalSupply = await contract.methods
          .totalSupply()
          .call(null, block);
        const coinBalances = await Promise.all(
          stkToken.COINS.map((_, index) =>
            minterContract.methods.balances(index).call(null, block),
          ),
        );
        const ratio = BigNumber(balances[stkToken.STKCVXCRV3CRYPTO_ABRA]).div(
          totalSupply,
        );
        delete balances[stkToken.STKCVXCRV3CRYPTO_ABRA];
        stkToken.COINS.forEach((coin, index) => {
          balances[coin] = BigNumber(balances[coin] || 0)
            .plus(BigNumber(coinBalances[index]).times(ratio))
            .toFixed();
        });
      } catch {}
    }
  }

  const yVaultAssets = Object.keys(UNDERLYINGS);
  for (const asset of yVaultAssets) {
    if (balances[asset]) {
      try {
        const underlying = UNDERLYINGS[asset];
        const assetContract = new web3.eth.Contract(ERC20_ABI, asset);
        const underlyingContract = new web3.eth.Contract(ERC20_ABI, underlying);
        const [underlyingBalance, assetTotalSupply] = await Promise.all([
          underlyingContract.methods.balanceOf(asset).call(null, block),
          assetContract.methods.totalSupply().call(null, block),
        ]);
        const balance = BigNumber(underlyingBalance)
          .times(balances[asset])
          .div(assetTotalSupply);
        delete balances[asset];
        balances[underlying] = BigNumber(balances[underlying] || 0)
          .plus(balance)
          .toFixed();
      } catch {}
    }
  }

  return { balances };
}

export { tvl };
