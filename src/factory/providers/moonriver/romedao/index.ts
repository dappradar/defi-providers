import TREASURY_ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';

const TREASURY = '0xfbAD41e4Dd040BC80c89FcC6E90d152A746139aF';
const STAKING = '0x6f7D019502e17F1ef24AC67a260c65Dd23b759f1';
const ROME = '0x4a436073552044D5f2f49B176853ad3Ad473d9d6';
const DEPOSITORIES = [
  '0x91a5184741FDc64f7507A7db6Aa3764a747f8089',
  '0xE2F71c68db7ECC0c9A907AD2E40E2394c5CAc367',
  '0x065588602bd7206B15f9630FDB2e81E4Ca51ad8A',
  '0xC82d354Cc96b5Cd0ee5B63569b5b51a2D3c5a895',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 991411) {
    return {};
  }

  let tokens = [];
  try {
    tokens = await basicUtil.readDataFromFile('token01.json', chain, provider);
  } catch {}

  for (let i = tokens.length; ; i++) {
    const token = await util.executeCall(
      TREASURY,
      TREASURY_ABI,
      'reserveTokens',
      [i],
      block,
      chain,
      web3,
    );
    if (token) {
      tokens.push(token);
    } else {
      break;
    }
  }
  basicUtil.writeDataToFile(tokens, 'token01.json', chain, provider);

  const [reserves, stakedAmount, depositoryBalances] = await Promise.all([
    util.getTokenBalances(TREASURY, tokens, block, chain, web3),
    util.getTokenBalances(STAKING, [ROME], block, chain, web3),
    util.getTokenBalancesOfEachHolder(DEPOSITORIES, [ROME], block, chain, web3),
  ]);

  const balances = {};
  formatter.sumMultiBalanceOf(balances, reserves);
  formatter.sumMultiBalanceOf(balances, stakedAmount);
  formatter.sumMultiBalanceOf(balances, depositoryBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
