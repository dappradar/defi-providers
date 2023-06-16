import BigNumber from 'bignumber.js';
import POOL_ABI from './abi.json';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';

const POOL_ADDRESSES = [
  '0xfAA267C3Bb25a82CFDB604136a29895D30fd3fd8', //UNI PICKLE/ETH
  '0xd3F6732D758008E59e740B2bc2C1b5E420b752c2', //pSLP yveCRV
  '0xf5bD1A4894a6ac1D786c7820bC1f36b1535147F6', //p3CRV
  '0x6092c7084821057060ce2030F9CC11B22605955F', //pSLP DAI
  '0x8f720715d34ff1fda1342963ef6372d1557db3a7', //pSLP USDC
  '0x421476a3c0338E929cf9B77f7D087533bc9d2a2d', //pSLP USDT
  '0xD55331E7bCE14709d825557E5Bca75C73ad89bFb', //pSLP WBTC
  '0x2E32b1c2D7086DB1620F4586E09BaC7147640838', //pSLP YFI
  '0x4731CD18fFfF2C2A43f72eAe1B598dC3c0C16912', //stETH-ETH
  '0x02c9420467a22ad6067ef0CB4459752F45266C07', //pUNIV2 MIR/UST
  '0xd7513F24B4D3672ADD9AF6C739Eb6EeBB85D8dD5', //pUNIV2 MTSLA/UST
  '0x2Df015B117343e24AEC9AC99909A4c097a2828Ab', //pUNIV2 MAAPL/UST
  '0x3D24b7693A0a5Bf13977b19C81460aEd3f60C150', //pUNIV2 MQQQ/UST
  '0x1456846B5A7d3c7F9Ea643a4847376fB19fC1aB1', //pUNIV2 MSLV/UST
  '0x6Ea17c249f6cFD434A01c54701A8694766b76594', //pUNIV2 MBABA/UST
  '0xdaf08622Ce348fdEA09709F279B6F5673B1e0dad', //pSLP SUSHI
  '0xeA5b46877E2d131405DB7e5155CC15B8e55fbD27', //pUNIV2 FEI/TRIBE
  '0xDA481b277dCe305B97F4091bD66595d57CF31634', //pSUSHIYVBOOST
  '0xE9bEAd1d3e3A25E8AF7a6B40e48de469a9613EDe', //pSUSHIALCX
  '0x9e1126c51c319A1d31d928DC498c9988C094e793', //pYEARNUSDCV2
  '0x2040c856d53d5CbB111c81D5A85ccc10829c5783', //pYEARNCRVLUSD
  '0x62e558cda4619e31af8c84cd8f345fa474afe1b9', //pSUSHICVX
  '0xA7BC844a76e727Ec5250f3849148c21F4b43CeEA', //pLQTY
];
const PTOKENS = [
  '0x68d14d66B2B0d6E157c06Dc8Fefa3D8ba0e66a89',
  '0x2E35392F4c36EBa7eCAFE4de34199b2373Af22ec',
  '0x1BB74b5DdC1f4fC91D6f9E7906cf68bc93538e33',
  '0x77c8a58d940a322aea02dbc8ee4a30350d4239ad',
  '0xCffA068F1E44D98D3753966eBd58D4CFe3BB5162',
  '0x53Bf2E62fA20e2b4522f05de3597890Ec1b352C6',
  '0x09FC573c502037B149ba87782ACC81cF093EC6ef',
  '0xc80090AA05374d336875907372EE4ee636CBC562',
  '0x55282da27a3a02ffe599f6d11314d239dac89135',
  '0x8c2d16b7f6d3f989eb4878ecf13d695a7d504e43',
  '0xa7a37ae5cb163a3147de83f15e15d8e5f94d6bce',
  '0xde74b6c547bd574c3527316a2ee30cd8f6041525',
  '0x3261D9408604CC8607b687980D40135aFA26FfED',
  '0x2350fc7268F3f5a6cC31f26c38f706E41547505d',
  '0xC66583Dd4E25b3cfc8D881F6DbaD8288C7f5Fd30',
  '0x0faa189afe8ae97de1d2f01e471297678842146d',
  '0x5eff6d166d66bacbc1bf52e2c54dd391ae6b1f48',
  '0x6949Bb624E8e8A90F87cD2058139fcd77D2F3F87',
];

let tokens = {};

async function getTokens(address, block, web3) {
  try {
    if (!tokens[address]) {
      const contract = new web3.eth.Contract(POOL_ABI, address);
      try {
        const token = await contract.methods.TOKEN().call(null, block);
        tokens[address] = token;
      } catch {
        const token = await contract.methods.token().call(null, block);
        tokens[address] = token;
      }
    }
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: getTokens of ethereum/pickle`,
      endpoint: 'getTokens',
    });
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 10960581) {
    return {};
  }

  try {
    tokens = await basicUtil.readDataFromFile('pools.json', chain, provider);
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tvl of ethereum/pickle`,
      endpoint: 'tvl',
    });
  }

  await Promise.all([
    Promise.all(POOL_ADDRESSES.map((pool) => getTokens(pool, block, web3))),
    Promise.all(PTOKENS.map((token) => getTokens(token, block, web3))),
  ]);
  await basicUtil.writeDataToFile(tokens, 'pools.json', chain, provider);

  let balanceResults = [];
  if (block >= 11439603) {
    const availablePools = POOL_ADDRESSES.filter((pool) => tokens[pool]);
    balanceResults = await util.getTokenBalancesOfHolders(
      availablePools,
      availablePools.map((pool) => tokens[pool]),
      block,
      chain,
      web3,
    );
  }

  let availableTokens;
  if (block < 11439603) {
    availableTokens = Object.keys(tokens);
  } else {
    availableTokens = PTOKENS.filter((token) => tokens[token]);
  }

  const results = await Promise.all([
    util.executeCallOfMultiTargets(
      availableTokens,
      POOL_ABI,
      'balance',
      [],
      block,
      chain,
      web3,
    ),
    util.executeMultiCallsOfMultiTargets(
      availableTokens.map((token) => tokens[token]),
      ERC20_ABI,
      'balanceOf',
      availableTokens.map((token) => [token]),
      block,
      chain,
      web3,
    ),
  ]);

  availableTokens.forEach((token, index) => {
    const balance1 = BigNumber(results[0][index] || 0);
    const balance2 = BigNumber(results[1][index] || 0);
    if (balance1.isGreaterThan(0)) {
      balanceResults.push({
        token: tokens[token],
        balance: balance1,
      });
    } else if (balance2.isGreaterThan(0)) {
      balanceResults.push({
        token: tokens[token],
        balance: balance2,
      });
    }
  });

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults, chain, provider);
  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );
  return { balances };
}

export { tvl };
