import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import TOKEN_ABI from './abi.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const LP_TOKENS = [
  '0x0d26d103c91f63052fbca88aaf01d5304ae40015',
  '0x909b0ce4fac1a0dca78f8ca7430bbafeeca12871',
  '0xc1daa16e6979c2d1229cb1fd0823491ea44555be',
  '0xAEf735B1E7EcfAf8209ea46610585817Dc0a2E16',
  '0x776628A5C37335608DD2a9538807b9bba3869E14',
  '0xc7388D98Fa86B6639d71A0A6d410D5cDfc63A1d0',
  '0xFC95481F79eC965A535Ed8cef4630e1dd308d319',
  '0x6FD4b4c38ED80727EcD0d58505565F9e422c965f',
  '0x035D7D7F209B5d18e2AB5C2072E85B32e1D43760',
  '0xF01cEA00598d87Cb9792a01B040d04b0bd8Ca781',
  '0x4E5704991b43C1D33b9Ccd1BC33B211bf068385A',
  '0xC73eeD4494382093C6a7C284426A9a00f6C79939',
  '0xA2A7EE49750Ff12bb60b407da2531dB3c50A1789',
  '0xc1Daa16E6979C2D1229cB1fd0823491eA44555Be',
  '0x909B0ce4FaC1A0dCa78F8Ca7430bBAfeEcA12871',
  '0x0D26D103c91F63052Fbca88aAF01d5304Ae40015',
  '0x6220BaAd9D08Dee465BefAE4f82ee251cF7c8b82',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 7410026) {
    return {};
  }

  let lpTokens = {};
  try {
    lpTokens = await basicUtil.readDataFromFile(
      'cache/pools.json',
      chain,
      provider,
    );
  } catch {}

  const newLPTokens = LP_TOKENS.filter((address) => !lpTokens[address]);

  if (newLPTokens.length > 0) {
    const underlyings = await util.executeCallOfMultiTargets(
      newLPTokens,
      TOKEN_ABI,
      'underlyingToken',
      [],
      block,
      chain,
      web3,
    );

    underlyings.forEach((underlying, index) => {
      if (underlying) {
        lpTokens[newLPTokens[index]] = underlying.toLowerCase();
      }
    });

    basicUtil.writeDataToFile(lpTokens, 'cache/pools.json', chain, provider);
  }

  const tokenBalances = await util.getTokenBalancesOfHolders(
    LP_TOKENS,
    LP_TOKENS.map((address) => lpTokens[address]),
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
