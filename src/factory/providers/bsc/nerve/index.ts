import BigNumber from 'bignumber.js';
import POOL_ABI from './abi/abi.json';
import BULK_BALANCE_ABI from './abi/bulk_balance_abi.json';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { log } from '../../../../util/logger/logger';

const BULK_BALANCE_ADDRESS = '0xAd0fAf54c2dA55e9BC0B2f4b2C9098979E7b3022';
const BTCPoolAddress = '0x6C341938bB75dDe823FAAfe7f446925c66E6270c';
const USDPoolAddress = '0x1B3771a66ee31180906972580adE9b81AFc5fCDc';
const ETHPoolAddress = '0x146CD24dCc9f4EB224DFd010c5Bf2b0D25aFA9C0';
const EXRVAddress = '0x15B9462d4Eb94222a7506Bc7A25FB27a2359291e';
const RUSDPoolAddress = '0x0eafaa7ed9866c1f08ac21dd0ef3395e910f7114';
const FUSDTPoolAddress = '0xd0fBF0A224563D5fFc8A57e4fdA6Ae080EbCf3D3';
const USTPoolAddress = '0x2dcCe1586b1664f41C72206900e404Ec3cA130e0';

const TOKENS = {
  '0xe9e7cea3dedca5984780bafc599bd69add087d56': USDPoolAddress, // BUSD
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': USDPoolAddress, // Binance Pegged USDC
  '0x55d398326f99059ff775485246999027b3197955': USDPoolAddress, // Binance Pegged USDT
  '0x07663837218a003e66310a01596af4bf4e44623d': RUSDPoolAddress, // rUSD
  //'0xf2511b5e4fb0e5e2d123004b672ba14850478c14': RUSDPoolAddress, // 3NRV-LP
  '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c': BTCPoolAddress, // Binance Pegged BTC
  '0x54261774905f3e6e9718f2abb10ed6555cae308a': BTCPoolAddress, // anyBTC
  '0x2170ed0880ac9a755fd29b2688956bd959f933f8': ETHPoolAddress, // Binance Pegged ETH
  '0x6f817a0ce8f7640add3bc0c1c2298635043c2423': ETHPoolAddress, // anyETH
  '0x42F6f551ae042cBe50C739158b4f0CAC0Edb9096': EXRVAddress, // NRV
  '0x049d68029688eabf473097a2fc38ef61633a3c7a': FUSDTPoolAddress, // FUSDT
  '0xf2511b5e4fb0e5e2d123004b672ba14850478c14': FUSDTPoolAddress, // 3NRV-LP
  '0x23396cf899ca06c4472205fc903bdb4de249d6fc': USTPoolAddress, // UST
};

const TOKEN_CONVERT = {
  '0x54261774905f3e6e9718f2abb10ed6555cae308a':
    '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
  '0x6f817a0ce8f7640add3bc0c1c2298635043c2423':
    '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
  '0x07663837218a003e66310a01596af4bf4e44623d':
    '0x6b175474e89094c44da98b954eedeac495271d0f',
  '0x049d68029688eabf473097a2fc38ef61633a3c7a':
    '0x6b175474e89094c44da98b954eedeac495271d0f',
};

async function getBalances(address, token, block, web3) {
  try {
    const contract = new web3.eth.Contract(ERC20_ABI, token);
    const balance = await contract.methods.balanceOf(address).call(null, block);
    if (address === '0xf2511b5e4fb0e5e2d123004b672ba14850478c14') {
      const balances = await getUnderlyingBalances(
        address,
        balance,
        block,
        web3,
      );
      return { balances };
    }
    return [
      {
        token_address: token,
        balance,
      },
    ];
  } catch {
    return [];
  }
}

async function getUnderlyingBalances(address, balance, block, web3) {
  try {
    const contract = new web3.eth.Contract(POOL_ABI, address);
    const totalSupply = await contract.methods.totalSupply().call(null, block);
    const ratio = balance.div(new BigNumber(totalSupply));
    const balances = [];
    for (let i = 0; ; i += 1) {
      try {
        const token = await contract.methods.getToken(i).call(null, block);
        const balance = await contract.methods
          .getTokenBalance(i)
          .call(null, block);
        balances.push({
          token_address: token.toLowerCase(),
          balance: new BigNumber(balance).times(ratio),
        });
      } catch {
        break;
      }
    }
    return { balances };
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: getVaults of polygon/beefyfinanace`,
      endpoint: 'getVaults',
    });
    return null;
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, web3 } = params;
  if (block < 5289331) {
    return {};
  }

  let balanceResults = [];
  if (block < 9097045) {
    balanceResults = await Promise.all(
      Object.keys(TOKENS).map((token) =>
        getBalances(TOKENS[token], token, block, web3),
      ),
    );
  } else {
    const contract = new web3.eth.Contract(
      BULK_BALANCE_ABI,
      BULK_BALANCE_ADDRESS,
    );
    const availablePools = Object.keys(TOKENS).map((token) => TOKENS[token]);
    balanceResults = [
      await contract.methods
        .tokenBalancesManyTokensManyHolders(availablePools, Object.keys(TOKENS))
        .call(null, block),
    ];
  }

  const balances = {};
  balanceResults.forEach((results) => {
    results.forEach((result) => {
      if (result && new BigNumber(result.balance).isGreaterThan(0)) {
        let address = result.token_address.toLowerCase();
        if (TOKEN_CONVERT[address]) {
          address = TOKEN_CONVERT[address];
        }
        if (!balances[address]) {
          balances[address] = new BigNumber(0);
        }
        balances[address] = balances[address].plus(
          new BigNumber(result.balance),
        );
      }
    });
  });

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
