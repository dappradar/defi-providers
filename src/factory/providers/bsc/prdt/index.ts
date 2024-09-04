import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';

const contracts = [
  '0x31B8A8Ee92961524fD7839DC438fd631D34b49C6',
  '0x00199E444155f6a06d74CF36315419d39b874f5c',
  '0xE39A6a119E154252214B369283298CDF5396026B',
  '0x3Df33217F0f82c99fF3ff448512F22cEf39CC208',
  '0x599974D3f2948b50545Fb5aa77C9e0bddc230ADE',
  '0x22dB94d719659d7861612E0f43EE28C9FF9909C7',
  '0x49eFb44831aD88A9cFFB183d48C0c60bF4028da8',
];

const TOKENS = [
  '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  '0x55d398326f99059fF775485246999027B3197955',
  '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 30325393) {
    return {};
  }

  const balances = {};
  let totalBnbBalance = new BigNumber(0);

  for (const contract of contracts) {
    const tokenBalances = await util.getTokenBalances(
      contract,
      TOKENS,
      block,
      chain,
      web3,
    );

    const bnbBalance = await web3.eth.getBalance(contract, block);

    formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
    totalBnbBalance = totalBnbBalance.plus(bnbBalance);
  }

  balances['bnb'] = totalBnbBalance.toString();

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
