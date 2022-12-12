import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import ABI from './abi.json';

const MAI_VAULTS = [
  [
    '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
    '0x1066b8FC999c1eE94241344818486D5f944331A0',
  ],
  [
    '0x0DEC85e74A92c52b7F708c4B10207D9560CEFaf0',
    '0x7efB260662a6FA95c1CE1092c53Ca23733202798',
  ],
  [
    '0x637eC617c86D24E421328e6CAEa1d92114892439',
    '0x682E473FcA490B0adFA7EfE94083C1E63f28F034',
  ],
  [
    '0x74b23882a30290451A17c44f4F05243b6b58C76d',
    '0xD939c268C49c442F037E968F045ba02f499562D4',
  ],
  [
    '0x321162Cd933E2Be498Cd2267a90534A804051b11',
    '0xE5996a2cB60eA57F03bf332b5ADC517035d8d094',
  ],
  [
    '0xae75A438b2E0cB8Bb01Ec1E1e376De11D44477CC',
    '0x267bDD1C19C932CE03c7A62BBe5b95375F9160A6',
  ],
  [
    '0xb3654dc3d10ea7645f8319668e8f54d2574fbdc8',
    '0xd6488d586E8Fcd53220e4804D767F19F5C846086',
  ],
  [
    '0x6a07A792ab2965C72a5B8088d3a069A7aC3a993B',
    '0xdB09908b82499CAdb9E6108444D5042f81569bD9',
  ],
  [
    '0x49c68edb7aebd968f197121453e41b8704acde0c',
    '0x3609A304c6A41d87E895b9c1fd18c02ba989Ba90',
  ],
  [
    '0x0a03d2c1cfca48075992d810cc69bd9fe026384a',
    '0xC1c7eF18ABC94013F6c58C6CdF9e829A48075b4e',
  ],
  [
    '0x97927abfe1abbe5429cbe79260b290222fc9fbba',
    '0x5563Cc1ee23c4b17C861418cFF16641D46E12436',
  ],
  [
    '0x6dfe2aaea9daadadf0865b661b53040e842640f8',
    '0x8e5e4D08485673770Ab372c05f95081BE0636Fa2',
  ],
  [
    '0x920786cff2a6f601975874bb24c63f0115df7dc8',
    '0xBf0ff8ac03f3E0DD7d8faA9b571ebA999a854146',
  ],
  [
    '0x6c021Ae822BEa943b2E66552bDe1D2696a53fbB7',
    '0x051b82448a521bC32Ac7007a7A76F9dEC80F6BA2',
  ],
  [
    '0x4cdF39285D7Ca8eB3f090fDA0C069ba5F4145B37',
    '0xD60FBaFc954Bfbd594c7723C980003c196bDF02F',
  ],
  [
    '0x5cc61a78f164885776aa610fb0fe1257df78e59b',
    '0xCB99178C671761482097F32595cb79fb28a49Fd8',
  ],
  [
    '0xCe2Fc0bDc18BD6a4d9A725791A3DEe33F3a23BB7',
    '0x7aE52477783c4E3e5c1476Bbb29A8D029c920676',
  ],
  [
    '0xd817A100AB8A29fE3DBd925c2EB489D67F758DA9',
    '0x571F42886C31f9b769ad243e81D06D0D144BE7B4',
  ],
  [
    '0x2C850cceD00ce2b14AA9D658b7Cad5dF659493Db',
    '0x6d6029557a06961aCC5F81e1ffF5A474C54e32Fd',
  ],
];

const FTM_LPS = [
  //Vault, token, LP
  [
    '0x9BA01B1279B1F7152b42aCa69fAF756029A9ABDe',
    '0x2a30C5e0d577108F694d2A96179cd73611Ee069b',
    '0xf0702249F4D3A25cD3DED7859a165693685Ab577',
  ],
  [
    '0xF34e271312e41Bbd7c451B76Af2AF8339D6f16ED',
    '0xA3e3Af161943CfB3941B631676134bb048739727',
    '0xFdb9Ab8B9513Ad9E419Cf19530feE49d412C3Ee3',
  ],
  [
    '0xB595C02147bCEDE84e0E85D9e95727cF38C02b07',
    '0xee3a7c885fd3cc5358ff583f2dab3b8bc473316f',
    '0xEc7178F4C41f346b2721907F5cF7628E388A7a58',
  ],
  [
    '0x3F4f523ACf811E713e7c34852b24E927D773a9e5',
    '0x27c77411074ba90ca35e6f92a79dad577c05a746',
    '0x2a651563c9d3af67ae0388a5c8f89b867038089e',
  ],
  [
    '0x872C847056e11cF75D1D9636b522D077E8C9F653',
    '0xae94e96bf81b3a43027918b138b71a771d381150',
    '0x4733bc45eF91cF7CcEcaeeDb794727075fB209F2',
  ],
  [
    '0x413f1815D32e5aca0d8984FA89e50E83dDac0BBE',
    '0x5d2EF803D6e255eF4D1c66762CBc8845051B54dB',
    '0x9606d683d03f012dda296ef0ae9261207c4a5847',
  ],
  [
    '0x03c20569c2c78CD48f491415a4cDEAC02608DB7e',
    '0xA4e2EE5a7fF51224c27C98098D8DB5C770bAAdbE',
    '0xe7e90f5a767406eff87fdad7eb07ef407922ec1d',
  ],
  [
    '0xD3af91f21F791F29FC664cD5cD61180edc263191',
    '0xD8dd2EA228968F7f043474Db610A20aF887866c7',
    '0xd14dd3c56d9bc306322d4cea0e1c49e9ddf045d4',
  ],
];

const MOO_TOKENS = [
  [
    '0xbf07093ccd6adfc3deb259c557b61e94c1f66945',
    '0x75D4aB6843593C111Eeb02Ff07055009c836A1EF',
  ],
];

const YEARN_TOKENS = [
  [
    '0xCe2Fc0bDc18BD6a4d9A725791A3DEe33F3a23BB7',
    '0x7aE52477783c4E3e5c1476Bbb29A8D029c920676',
  ],
  [
    '0xd817A100AB8A29fE3DBd925c2EB489D67F758DA9',
    '0x571F42886C31f9b769ad243e81D06D0D144BE7B4',
  ],
  [
    '0x2C850cceD00ce2b14AA9D658b7Cad5dF659493Db',
    '0x6d6029557a06961aCC5F81e1ffF5A474C54e32Fd',
  ],
];

const CONVERT = {
  '0xbf07093ccd6adfc3deb259c557b61e94c1f66945':
    '0xd6070ae98b8069de6b494332d1a1a81b6179d960',
  '0xa48d959ae2e88f1daa7d5f611e01908106de7598':
    '0x841fad6eae12c286d1fd18d1d525dffa75c7effe',
  '0x7345a537a975d9ca588ee631befddfef34fd5e8f':
    '0x5cc61a78f164885776aa610fb0fe1257df78e59b',
  '0x0dec85e74a92c52b7f708c4b10207d9560cefaf0':
    '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
  '0x637ec617c86d24e421328e6caea1d92114892439':
    '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
  '0x49c68edb7aebd968f197121453e41b8704acde0c':
    '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
  '0x0a03d2c1cfca48075992d810cc69bd9fe026384a':
    '0x74b23882a30290451a17c44f4f05243b6b58c76d',
  '0x97927abfe1abbe5429cbe79260b290222fc9fbba':
    '0x321162cd933e2be498cd2267a90534a804051b11',
  '0x6dfe2aaea9daadadf0865b661b53040e842640f8':
    '0xb3654dc3d10ea7645f8319668e8f54d2574fbdc8',
  '0x920786cff2a6f601975874bb24c63f0115df7dc8':
    '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
  '0xce2fc0bdc18bd6a4d9a725791a3dee33f3a23bb7':
    '0x74b23882a30290451a17c44f4f05243b6b58c76d',
  '0xd817a100ab8a29fe3dbd925c2eb489d67f758da9':
    '0x321162cd933e2be498cd2267a90534a804051b11',
  '0x2c850cced00ce2b14aa9d658b7cad5df659493db':
    '0x29b0da86e484e1c0029b56e817912d778ac0ec69',
};

async function getMooBalances(block, chain, web3) {
  if (block < 19101495) {
    return {};
  }

  const [tokenBalances, pricePerShares] = await Promise.all([
    util.getTokenBalancesOfHolders(
      MOO_TOKENS.map((token) => token[1]),
      MOO_TOKENS.map((token) => token[0]),
      block,
      chain,
      web3,
    ),
    util.executeCallOfMultiTargets(
      MOO_TOKENS.map((token) => token[0]),
      ABI,
      'getPricePerFullShare',
      [],
      block,
      chain,
      web3,
    ),
  ]);

  const balances = [];
  tokenBalances.forEach((lpBalance, index) => {
    if (lpBalance) {
      balances.push({
        token: CONVERT[MOO_TOKENS[index][0]] || MOO_TOKENS[index][0],
        balance: lpBalance.balance.times(pricePerShares[index]).div(1e18),
      });
    }
  });

  return balances;
}

async function getMoolLpBalances(block, chain, web3) {
  const [lpBalances, pricePerShares] = await Promise.all([
    util.getTokenBalancesOfHolders(
      FTM_LPS.map((token) => token[0]),
      FTM_LPS.map((token) => token[1]),
      block,
      chain,
      web3,
    ),
    util.executeCallOfMultiTargets(
      FTM_LPS.map((token) => token[1]),
      ABI,
      'getPricePerFullShare',
      [],
      block,
      chain,
      web3,
    ),
  ]);

  const balances = [];
  lpBalances.forEach((lpBalance, index) => {
    if (lpBalance) {
      balances.push({
        token: FTM_LPS[index][2],
        balance: lpBalance.balance.times(pricePerShares[index]).div(1e18),
      });
    }
  });

  return balances;
}

async function getBooBalances(block, chain, web3) {
  const balances = await util.getTokenBalancesOfHolders(
    [
      '0xf18F4847a5Db889B966788dcbDbcBfA72f22E5A6',
      '0xedF25e618E4946B05df1E33845993FfEBb427A0F',
    ],
    [
      '0xa48d959ae2e88f1daa7d5f611e01908106de7598',
      '0x7345a537A975d9Ca588eE631BEFdDfEF34fD5e8f',
    ],
    block,
    chain,
    web3,
  );

  balances.forEach((data) => {
    if (data) {
      data.token = CONVERT[data.token] || data.token;
    }
  });

  return balances;
}

async function getYearnTokenBalances(block, chain, web3) {
  const [balances, pricePerShares, underlyingTokens] = await Promise.all([
    util.getTokenBalancesOfHolders(
      YEARN_TOKENS.map((token) => token[1]),
      YEARN_TOKENS.map((token) => token[0]),
      block,
      chain,
      web3,
    ),
    util.executeCallOfMultiTargets(
      YEARN_TOKENS.map((token) => token[0]),
      ABI,
      'pricePerShare',
      [],
      block,
      chain,
      web3,
    ),
    util.executeCallOfMultiTargets(
      YEARN_TOKENS.map((token) => token[0]),
      ABI,
      'token',
      [],
      block,
      chain,
      web3,
    ),
  ]);

  const tokenBalances = [];
  balances.forEach((data, index) => {
    if (data && underlyingTokens[index]) {
      tokenBalances.push({
        token: underlyingTokens[index].toLowerCase(),
        balance: data.balance
          .times(pricePerShares[index])
          .div(10 ** Math.log10(pricePerShares[index])),
      });
    }
  });

  return tokenBalances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;

  if (block < 15164134) {
    return {};
  }

  const tokenBalances = {};

  const results = await Promise.all([
    util.getTokenBalancesOfHolders(
      MAI_VAULTS.map((vault) => vault[1]),
      MAI_VAULTS.map((vault) => vault[0]),
      block,
      chain,
      web3,
    ),
    getBooBalances(block, chain, web3),
    getMoolLpBalances(block, chain, web3),
    getMooBalances(block, chain, web3),
    getYearnTokenBalances(block, chain, web3),
  ]);

  results[0].forEach((result) => {
    if (result) {
      result.token = CONVERT[result.token] || result.token;
    }
  });

  results.forEach((result) => {
    if (result) {
      formatter.sumMultiBalanceOf(tokenBalances, result);
    }
  });

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );

  return { balances };
}

export { tvl };
