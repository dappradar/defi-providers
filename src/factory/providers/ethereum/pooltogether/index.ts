import POOL_ABI from './abi.json';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOL_TOKEN = '0x0cec1a9154ff802e7934fc916ed7ca50bde6844e';
const POOL_ADDRESSES = [
  // Pool
  '0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a',
  '0x0650d780292142835F6ac58dd8E2a336e87b4393',
  '0xde9ec95d7708b8319ccca4b8bc92c0a3b70bf416',
  '0xBC82221e131c082336cf698F0cA3EBd18aFd4ce7',
  '0x396b4489da692788e327e2e4b2b0459a5ef26791',
  '0xc7d56c06F136EFff93e349C7BF8cc46bBF5D902c',
  '0xc32a0f9dfe2d93e8a60ba0200e033a59aec91559',
  '0x481f1BA81f7C01400831DfF18215961C3530D118',
  '0x3AF7072D29Adde20FC7e173a7CB9e45307d2FB0A',
  '0xc2a7dfb76e93d12a1bb1fa151b9900158090395d',
  // Faucet
  '0xF362ce295F2A4eaE4348fFC8cDBCe8d729ccb8Eb',
  '0xa5dddefD30e234Be2Ac6FC1a0364cFD337aa0f61',
  '0xbd537257fad96e977b9e545be583bbf7028f30b9',
  '0x72F06a78bbAac0489067A1973B0Cef61841D58BC',
  '0x30430419b86e9512E6D93Fc2b0791d98DBeb637b',
  '0xddcf915656471b7c44217fb8c51f9888701e759a',
  '0x9A29401EF1856b669f55Ae5b24505b3B6fAEb370',
  // Pod
  '0x2f994e2E4F3395649eeE8A89092e63Ca526dA829',
  '0x386EB78f2eE79AddE8Bdb0a0e27292755ebFea58',
  // Treasury
  '0x21950E281bDE1714ffd1062ed17c56D4D8de2359',
  // Distributor
  '0xBE1a33519F586A4c8AA37525163Df8d67997016f',
  // Aave Yield Source
  '0x858415FdB262F17F7a63f6B1F6fEd7AF8308A1A7',
  '0x2bA1e000a381aD42af10C6e33aFe5994eE878D72',
  '0x4C8D99B0c7022923ef1A81ADb4E4e326f8E91ac9',
  '0x6E159B199423383572B7CB05FBbD54103A827F2b',
  '0xBa71a9907e88925F59a3658C3a7618440Df6406E',
  // Sushi Yield Source
  '0x9858aC37e385E52dA6385d828Cfe55a182D8ffA6',
];
let pools = {};

async function getTokens(address, web3) {
  try {
    if (!pools[address]) {
      const contract = new web3.eth.Contract(POOL_ABI, address);
      let token;
      try {
        try {
          token = await contract.methods.cToken().call();
        } catch {
          token = await contract.methods.asset().call();
        }
      } catch {
        try {
          token = await contract.methods.token().call();
        } catch {
          try {
            token = await contract.methods.depositToken().call();
          } catch {
            token = POOL_TOKEN;
          }
        }
      }
      pools[address] = token.toLowerCase();
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11104392) {
    return {};
  }

  try {
    pools = await basicUtil.readFromCache('pools.json', chain, provider);
  } catch {}

  await Promise.all(POOL_ADDRESSES.map((address) => getTokens(address, web3)));
  await basicUtil.saveIntoCache(pools, 'pools.json', chain, provider);

  const balanceResults = await util.getTokenBalancesOfHolders(
    POOL_ADDRESSES,
    POOL_ADDRESSES.map((address) => pools[address]),
    block,
    chain,
    web3,
  );

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults);
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
