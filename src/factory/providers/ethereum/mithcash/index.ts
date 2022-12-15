import BigNumber from 'bignumber.js';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import BOARDROOM_ABI from './abi/boardroom.json';
import POOL_ABI from './abi/pool.json';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const CONTRACTS = [
  {
    address: '0x14E33e1D6Cc4D83D7476492C0A52b3d4F869d892',
    stakeToken: 'lpt',
  },
  {
    address: '0x9D9418803F042CCd7647209b0fFd617981D5c619',
    stakeToken: 'lpt',
  },
  {
    address: '0xd91121Ba462311626dA546C529b8F07c84805346',
    stakeToken: 'mith',
  },
  {
    address: '0xcE0058827e6c89E625e524D2fE6E3EF3d9BB6A0c',
    stakeToken: 'dai',
  },
  {
    address: '0xFEf1Bcc7097dD184b2Cdb574068CF01b7B437694',
    stakeToken: 'YFI',
  },
  {
    address: '0xFb64597ddA1345317A4f4f5DBA2425384bC5fA7B',
    stakeToken: 'usdt',
  },
  {
    address: '0x2F251D32D024938C4F98cFB8B22A2d1aF0d3167A',
    stakeToken: 'esd',
  },
  {
    address: '0xa40F333f7f5FA17810C4F98Ed1a4061854f0294d',
    stakeToken: 'bac',
  },
  {
    address: '0xdf8752BA251EF13f5A49Dcdd8E9D24809f078E91',
    stakeToken: 'cream',
  },
  {
    address: '0x3B3CE26239Ddc65dC3fd2124D242Ad056338eAF1',
    stakeToken: 'frax',
  },
  {
    address: '0x113690cb0EFa6A3D3F78c0F3BcA97cbCdc720903',
    stakeToken: 'crv',
  },
  {
    address: '0x8e861153324024a2F3b26912B498f0c531830198',
    stakeToken: 'busd',
  },
  {
    address: '0x0555EEa5f419e18CFc338dEa66aE84Fa7A2fD2BA',
    stakeToken: 'link',
  },
  {
    address: '0x192376b6433164dc4bf64319E6443011a6E84235',
    stakeToken: 'comp',
  },
  {
    address: '0x7c0540852E552c2F6b981e89D2388E98935f9f4d',
    stakeToken: 'aave',
  },
  {
    address: '0xd1DE064281745F576eBa9cBff251aB031A0B8e99',
    stakeToken: 'sushi',
  },
  {
    address: '0x52cC1501f081ba069EEDa35eE91E7bbeEdcca965',
    stakeToken: 'susd',
  },
  {
    address: '0x27392910FC7921aC3B451E6a4568906371941df8',
    stakeToken: 'usdc',
  },
];
const BOARDROOM_ADDRESS = '0xb35f89160d1Dc47B6EAC1986D7821505c327AE09';
const MIS_ADDRESS = '0x4b4d2e899658fb59b1d518b68fe836b100ee8958';

async function loadBoardroom(block, web3) {
  try {
    const BOARDROOM = new web3.eth.Contract(BOARDROOM_ABI, BOARDROOM_ADDRESS);
    const totalStaked = await BOARDROOM.methods.totalSupply().call(null, block);
    return new BigNumber(totalStaked);
  } catch {
    return new BigNumber(0);
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const tokenBalances = {};
  if (11549987 <= block) {
    const boardroomBalance = await loadBoardroom(block, web3);
    tokenBalances[MIS_ADDRESS] = boardroomBalance;
  }

  const pools = CONTRACTS.map((contract) => contract.address);
  const methods = CONTRACTS.map((contract) => contract.stakeToken);

  const [tokens, results] = await Promise.all([
    util.executeDifferentCallsOfMultiTargets(
      pools,
      POOL_ABI,
      methods,
      pools.map((pool) => []),
      block,
      chain,
      web3,
    ),
    util.executeCallOfMultiTargets(
      pools,
      ERC20_ABI,
      'totalSupply',
      [],
      block,
      chain,
      web3,
    ),
  ]);

  const balanceResults = [];
  results.forEach((result, index) => {
    const balance = new BigNumber(result || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: tokens[index],
        balance,
      });
    }
  });

  formatter.sumMultiBalanceOf(tokenBalances, balanceResults);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );
  return { balances };
}

export { tvl };
