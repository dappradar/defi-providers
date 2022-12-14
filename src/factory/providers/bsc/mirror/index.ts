import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const TOKENS = [
  '0xECCF35F941Ab67FfcAA9A1265C2fF88865caA005',
  '0x23396cF899Ca06c4472205fC903bDB4de249D6fC',
  '0xfFBDB9BDCae97a962535479BB96cC2778D65F4dd',
  '0x7d5f9F8CF59986743f34BC137Fc197E2e22b7B05',
  '0x41D74991509318517226755E508695c4D1CE43a6',
  '0x5B6DcF557E2aBE2323c48445E8CC948910d8c2c9',
  '0x900AEb8c40b26A8f8DfAF283F884b03EE7Abb3Ec',
  '0x62D71B23bF15218C7d2D7E48DBbD9e9c650B173f',
  '0xF215A127A196e3988C09d052e16BcFD365Cd7AA3',
  '0xa04F060077D90Fe2647B61e4dA4aD1F97d6649dc',
  '0x1Cb4183Ac708e07511Ac57a2E45A835F048D7C56',
  '0x7426Ab52A0e057691E2544fae9C8222e958b2cfB',
  '0x0ab06caa3Ca5d6299925EfaA752A2D2154ECE929',
  '0x3947B992DC0147D2D89dF0392213781b04B25075',
  '0xcA2f75930912B85d8B2914Ad06166483c0992945',
  '0x1658AeD6C7dbaB2Ddbd8f5D898b0e9eAb0305813',
  '0x211e763d0b9311c08EC92D72DdC20AB024b6572A',
  '0x9cDDF33466cE007676C827C76E799F5109f1843C',
  '0x92E744307694Ece235cd02E82680ec37c657D23E',
  '0x5501F4713020cf299C3C5929da549Aab3592E451',
  '0x49022089e78a8D46Ec87A3AF86a1Db6c189aFA6f',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < 3543545) {
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
