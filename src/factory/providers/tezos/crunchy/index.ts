import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';

const FARM_ADDRESS = 'KT1KnuE87q1EKjPozJ5sRAjQA24FPsP57CE3';
let pools = {};

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 1521051) {
    return {};
  }

  try {
    pools = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  const contract = new web3.eth.Contract(null, FARM_ADDRESS);
  await contract.init();
  const farmLength = await contract.methods.nextFarmId().call(null, block);
  const farms = await contract.methods.getBigmap('farms').call(null, block);

  console.log(`farm length: ${farmLength}`);

  const balanceResults = [];

  for (let i = 0; i < farmLength; i++) {
    try {
      if (!pools[i]) {
        let tokenId;
        try {
          const tokenType = Object.keys(farms[i].value.poolToken.tokenType);
          if (tokenType[0] == 'fa2') {
            tokenId = farms[i].value.poolToken.tokenId;
          }
        } catch {}
        pools[i] = tokenId
          ? `${farms[i].value.poolToken.address}_${tokenId}`
          : farms[i].value.poolToken.address;
      }

      balanceResults.push({
        token: pools[i],
        balance: BigNumber(farms[i].value.poolBalance),
      });
    } catch {}
  }
  await basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  const tokenBalances = {};

  formatter.sumMultiBalanceOf(tokenBalances, balanceResults, chain, provider);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );

  return { balances };
}

export { tvl };
