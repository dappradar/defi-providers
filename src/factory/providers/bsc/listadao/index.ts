import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const stakedListaBnb = '0xB0b84D294e0C75A6abe60171b70edEb2EFd14A1B';
const listaStakeManager = '0x1adB950d8bB3dA4bE104211D5AB038628e477fE6';
const wbnb = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = {};

  const stakedListaBnbBalance = await util
    .getTotalSupply(stakedListaBnb, block, web3)
    .then((res) => res.totalSupply);

  balances[wbnb] = await util.executeCall(
    listaStakeManager,
    [
      {
        inputs: [
          {
            internalType: 'uint256',
            name: '_amountInSlisBnb',
            type: 'uint256',
          },
        ],
        name: 'convertSnBnbToBnb',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    'convertSnBnbToBnb',
    [new BigNumber(stakedListaBnbBalance).toFixed()],
    block,
    chain,
    web3,
  );

  const tokenBalances = await util.getTokenBalancesOfHolders(
    [
      '0x986b40C2618fF295a49AC442c5ec40febB26CC54',
      '0x6F28FeC449dbd2056b76ac666350Af8773E03873',
      '0x91e49983598685DD5ACAc90CEb4061A772f6E5Ae',
      '0xA230805C28121cc97B348f8209c79BEBEa3839C0',
      '0xf45C3b619Ee86F653805E007fE211B7e930E0b3B',
      '0xA230805C28121cc97B348f8209c79BEBEa3839C0',
      '0xad9eAAe95617c39019aCC42301a1dCa4ea5b6f65',
      '0xd7E33948e2a43e7C1ec2F19937bf5bf8BbF9BaE8',
      '0x2367f2Da6fd39De6944218CC9EC706BCdc9a6918',
      '0x876cd9a380Ee7712129b52f8293F6f06056c3104',
    ],
    [
      wbnb,
      '0xB0b84D294e0C75A6abe60171b70edEb2EFd14A1B',
      '0xB0b84D294e0C75A6abe60171b70edEb2EFd14A1B',
      '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
      '0xa2E3356610840701BDf5611a53974510Ae27E2e1',
      '0xa2E3356610840701BDf5611a53974510Ae27E2e1',
      '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
      '0x2416092f143378750bb29b79eD961ab195CcEea5',
      '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A',
      '0x80137510979822322193FC997d400D5A6C747bf7',
    ],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  balances['bnb'] = balances[wbnb];
  delete balances[wbnb];
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
