import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const TOKENS = [
  '0xd2877702675e6cEb975b4A1dFf9fb7BAF4C91ea9',
  '0xa47c8bf37f92aBed4A126BDA807A7b7498661acD',
  '0xcAAfF72A8CbBfc5Cf343BA4e26f65a257065bFF1',
  '0x676Ad1b33ae6423c6618C1AEcf53BAa29cf39EE5',
  '0x156B36ec68FdBF84a925230BA96cb1Ca4c4bdE45',
  '0x09a3EcAFa817268f77BE1283176B946C4ff2E608',
  '0xd36932143F6eBDEDD872D5Fb0651f4B72Fd15a84',
  '0x59A921Db27Dd6d4d974745B7FfC5c33932653442',
  '0x21cA39943E91d704678F5D00b6616650F066fD63',
  '0xC8d674114bac90148d11D3C1d33C61835a0F9DCD',
  '0x13B02c8dE71680e71F0820c996E4bE43c2F57d15',
  '0xEdb0414627E6f1e3F082DE65cD4F9C693D78CCA9',
  '0x41BbEDd7286dAab5910a1f15d12CBda839852BD7',
  '0x0cae9e4d663793c2a2A0b211c1Cf4bBca2B9cAa7',
  '0x56aA298a19C93c6801FDde870fA63EF75Cc0aF72',
  '0x1d350417d9787E000cc1b95d70E9536DcD91F373',
  '0x9d1555d8cB3C846Bb4f7D5B1B1080872c3166676',
  '0x31c63146a635EB7465e5853020b39713AC356991',
  '0xf72FCd9DCF0190923Fadd44811E240Ef4533fc86',
  '0x0e99cC0535BB6251F6679Fa6E65d6d3b430e840B',
  '0x1e25857931F75022a8814e0B0c3a371942A88437',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11345215) {
    return {};
  }
  const balances = {};

  const results = await util.getTokenTotalSupplies(TOKENS, block, chain, web3);

  results.forEach((result) => {
    if (result && result.totalSupply.isGreaterThan(0)) {
      balances[result.token] = result.totalSupply.toFixed();
    }
  });
  return { balances };
}

export { tvl };
