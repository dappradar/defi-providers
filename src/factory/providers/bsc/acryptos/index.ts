import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import STRATEGY_ABI from './abis/strategyabi.json';
import POOL_ABI from './abis/poolabi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const strategyAddresses = [
  '0xA13A1e5B7c1D5D40087803A6d4b69b2FC00306D9',
  '0xCAD070F54Eb5b9eB3A0d72999C890aDb94F897b4',
  '0xBAEEaE8B1f096EEaA19cB382250ff2C2346d57Ef',
  '0xCB08C64209D14d0924404C8921DD72C61f004869',
  '0xaCc5B6101c77d519d2ab27F261c537A8D5fdF660',
  '0xd25EC338be80B6b95c02F1e181e3EC0a08Cda438',
  '0xa18fdBCFA0d260664f06729ba8430514D155d4D0',
  '0x24A87b844fA46008442186f1362a8123B0adA317',
  '0xB87A7C493Fc3D185a69De8456A8d6C43a1A238Ff',
  '0x1EaE0397274a7E2977F0B78678E22dB7014aB3b8',
  '0xE8b2e996FBB4D5f1fFD9bdbE5bC36F016B7D2a96',
  '0x5260D88b126280ad767a62528E3464E9D41db4f0',
  '0x3468bCB09b554420ceaD20C0Df6bbe93d635d0C6',
  '0x4bBfc7eFCd146E3dd1916Da99Fd72D4e5b3A55F1',
  '0x4469Ba4bC9dD89812B5c86E5fa9afd80d5789De0',
  '0x81031AC36fb2104561c3E00D490855828707da8A',
  '0x5c8c5852f3837B37b50497EA11397Ec175B5CcAB',
  '0xE53cDd2Eb4776B232fe066d24822BA98ccee386F',
  '0x97aDD6F966e74776DE2a1eB1dDae175D88448D77',
  '0x796b87d0feD110d48821D633db310701823663eB',
  '0xa5d0C46a8B29a44F099F034D4068921C5bf899c8',
  '0xE4784868701f4DcE7A0E6CEC4FB1B0b58e9BaF39',
  '0x060b86242471d7244414eD6F21C19B95010B46DB',
  '0x5ff576e31D672255891865A47cfA4fbE51801010',
  '0xEfbfc05A3ee143d13793972e1Fe789c17c1E5147',
  '0x7F1BCE47eeaC94a814bf0EEec794ED5F9d2D5E14',
  '0x4e754CE8E31D5B680c38E2DCB52A48430EA86ce2',
  '0xE720aF156e3ed714278AC87d92336a418fA196cC',
  '0x20d1D365834852f1FEa2DfAcD5121935F88A6F78',
  '0x316F6488821E08Ba7f44Ae8E8fe86CA1cd0D0F92',
  '0xe6d84B61E21E40c76B4F40832EB7a26bDda431eC',
  '0xAE4A006C954c5039211194816cFBEC30e2521BB5',
  '0xc404757f0eF09f9C4dd1144dc8DA296C91c09958',
  '0x8045DB83f60fe9fC8eb67593140eeEB4a71bDF51',
  '0x76044EF814F04C8c9A90f357404f013fd495bD24',
  '0x1eC76e41adee1A40B6042E8333325D14184631E3',
  '0xe979bA162fBCbe2c778fbeE9728e6fE3C8e02Ff8',
  '0xfB74C8F2A315c8FaAb8104E0AA5d2a96D6316aAF',
  '0xbf3ec11527B92FC328c6912c51bE29893f2F33B4',
  '0x96e38EC1190d49fD6B9bD25ac6800d3516C77fFD',
  '0x695577Ce7A44bC5E2f9948631b4E4E0Bb97A4845',
  '0x39731E0b93cB9a6325A9d9FAA3872cC59c9a4343',
  '0x5b7b647793b576D8c38525875c487913982226a8',
  '0x4dd298Dc6c71964fC9CEcceB4120BB436a30e916',
  '0x07020F1f18c4b55a38F7df39f2d092969808af43',
  '0x14EEf44F834B1ba0B231d4e1D98C1949B69B2257',
  '0x2D35344224F120ee9779D34C0BA6db40bEA4C83F',
  '0x748944DaaEcd92F889DB445cFbb35313295Db0Ee',
  '0xdbb259e3e97d6dFEa8895ac787bd7BeB32a35637',
  '0x48eC62F1FFBe599a1043A8fB3c778a9FaFf1B474',
  '0xb6cb85Be2FD476ED8e5565Ff302e27A7e9A52dEe',
  '0x59c663a90C5A3Ea38188acD9000e078548Db36CC',
  '0x01Bd7C8ff77b5869Ad3f5cE3BA1E072F47Ea43f4',
  '0x2B970F19F5c9cD98ED1e670c05F9a4409a7690bB',
  '0x65F9Fd38dcf661A38927e8e3aE93927A7C4892d1',
  '0x7d3aC947D44EfAf9eDAF75071CBb54bEc2310282',
  '0x70F97CDe011b1f85097F28acE3784E50f379bB4E',
  '0xCa8c49063FE969CE20de07AEA942CFb7C09A9A41',
  '0x0B470DcD7F94C94ED7bdf0Fa79F9790A10c03E34',
  '0x98D51537a0b7326385FBA9fA08e84F64162F7e66',
  '0x46E90e6DBE47f32eF5c3248E60963f7A1BB1D334',
  '0x38DE02145aa1Ddf9Db35B3e8e95fD32e9B744C8e',
  '0x7C98214bd7e191Fd16600eFb21f11388cEF32dc5',
  '0x300B57e8456EB985908792716DB2e8BD4Fb4A1af',
  '0xa72fc606529426a4ee50c339DA4323157117b1af',
  '0x91D5b257f2ec9F56ACB00188154dd6532D83ca8b',
  '0xb57068e5A9f2397d502DCa9055adc8B4AE4764E0',
  '0xf0214fE67B0D2d8c716c4c851c5be825b4913a61',
  '0x736654BeF068FCc1a1D46a33BdC29ec21A69fEe2',
  '0x7877032077adCDC7ef739a17316aC33Bb218531e',
  '0x24390dD6769bb8C8B54Af7c47C7e69791228Cb5D',
];

const poolAddresses = [
  '0xb3F0C9ea1F05e312093Fdb031E789A756659B0AC',
  '0x191409D5A4EfFe25b0f4240557BA2192D18a191e',
  '0x3919874C7bc0699cF59c981C5eb668823FA4f958',
  '0x99c92765EfC472a9709Ced86310D64C4573c4b77',
  '0xc61639E5626EcfB0788b5308c67CBbBD1cAecBF0',
  '0xbE7CAa236544d1B9A0E7F91e94B9f5Bfd3B5ca81',
];

let coins = {};

async function getPoolCoins(address, web3) {
  try {
    const contract = new web3.eth.Contract(POOL_ABI, address);

    if (!coins[address]) {
      coins[address] = [];
    }

    for (let id = coins[address].length; ; id += 1) {
      try {
        const token = await contract.methods.coins(id).call();
        coins[address].push(token.toLowerCase());
      } catch {
        break;
      }
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 1672120) {
    return {};
  }

  let wants = {};

  try {
    wants = basicUtil.readDataFromFile('cache/wants.json', chain, provider);
  } catch {}

  try {
    coins = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  const newStrategies = strategyAddresses.filter((address) => !wants[address]);
  const getPoolCoinsCalls = poolAddresses.map((address) =>
    getPoolCoins(address, web3),
  );

  const [newWants] = await Promise.all([
    await util.executeCallOfMultiTargets(
      newStrategies,
      STRATEGY_ABI,
      'want',
      [],
      block,
      chain,
      web3,
    ),
    Promise.all(getPoolCoinsCalls),
  ]);

  newStrategies.forEach((address, index) => {
    if (newWants[index]) {
      wants[address] = newWants[index].toLowerCase();
    }
  });

  basicUtil.writeDataToFile(wants, 'cache/wants.json', chain, provider);
  basicUtil.writeDataToFile(coins, 'cache/pools.json', chain, provider);

  let poolList = [];
  let idList = [];

  poolAddresses.forEach((address) => {
    poolList = poolList.concat(
      Array.from({ length: coins[address].length }, (v) => address),
    );
    idList = idList.concat(coins[address].map((coin, index) => index));
  });

  const [results, coinBalances] = await Promise.all([
    util.executeCallOfMultiTargets(
      strategyAddresses,
      STRATEGY_ABI,
      'balanceOf',
      [],
      block,
      chain,
      web3,
    ),
    util.executeMultiCallsOfMultiTargets(
      poolList,
      POOL_ABI,
      'balances',
      idList.map((id) => [id]),
      block,
      chain,
      web3,
    ),
  ]);

  const balanceResults = [];
  strategyAddresses.forEach((address, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: wants[address],
        balance,
      });
    }
  });

  poolList.forEach((address, index) => {
    const balance = BigNumber(coinBalances[index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: coins[address][idList[index]],
        balance,
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
