## DappRadar DeFi Providers

[DappRadar](https://dappradar.com/)

## Preinstall

Installation [Protoc](http://google.github.io/proto-lens/installing-protoc.html)

#### Mac OS X
```bash
PROTOC_ZIP=protoc-3.14.0-osx-x86_64.zip
curl -OL https://github.com/protocolbuffers/protobuf/releases/download/v3.14.0/$PROTOC_ZIP
sudo unzip -o $PROTOC_ZIP -d /usr/local bin/protoc
sudo unzip -o $PROTOC_ZIP -d /usr/local 'include/*'
rm -f $PROTOC_ZIP
```

#### Linux
```bash
PROTOC_ZIP=protoc-3.14.0-linux-x86_64.zip
curl -OL https://github.com/protocolbuffers/protobuf/releases/download/v3.14.0/$PROTOC_ZIP
sudo unzip -o $PROTOC_ZIP -d /usr/local bin/protoc
sudo unzip -o $PROTOC_ZIP -d /usr/local 'include/*'
rm -f $PROTOC_ZIP
```

## Installation

```bash
$ npm install
$ npm run build
$ npm run dev
```

## Adding New Provider

You can see all the chains and providers that have already been added in [providers](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers).

When adding a new provider, open a folder in that file and follow the convention in the integration examples below.

You can find the necessary generic functions with their definitions in the [util](https://github.com/dappradar/dappradar-defi-providers/blob/master/src/util/blockchainUtil.ts) or [calculators](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/util/calculators) file.

Pull request convention

```bash
[CHAIN] [PROVIDER] integration
```

By submitting the code, you transfer all the rights to the code to DappRadar UAB and retain no copyright or other intellectual property rights to it.

## Testing

After adding the new provider, you can test it with [Bloomrpc](https://github.com/bloomrpc/bloomrpc), [integration testing](https://github.com/dappradar/dappradar-defi-providers/blob/master/src/factory/factory.spec.ts) or by running this command:
```
npm run test <chain> <provider> <blocknumber>
```

## Integration examples

Uniswap V2 clone integration: [Sakeswap](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/ethereum/sakeswap)

Staking contract integrations: [RADAR](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/ethereum/radarstaking), [CityCoins](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/stacks/citycoins)

Integration based on subgraph: [Rubicon](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/optimism/rubicon)

Integration based on various smart contract methods calls: [Aave](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/avalanche/aave), [Iron](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/polygon/iron)

Integration where LP tokens are locked as TVL so their underlying balances have to be calculated: [Autofarm](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/bsc/autofarm)

## Code walk through of RADAR Staking contract integration

This integration computes RADAR token locked in DappRadar staking contract balance.

```typescript
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 15051901;
const STAKING_REWARDS_PROXY = '0x990d156d511d0493a0b7c32d1af97e0c9e352acd';
const RADAR_TOKEN = '0x44709a920fccf795fbc57baa433cc3dd53c44dbe';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const proxyBalance = await util.getTokenBalances(
    STAKING_REWARDS_PROXY,
    [RADAR_TOKEN],
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, proxyBalance);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
```

**Line 5: START_BLOCK constant**
```typescript
const START_BLOCK = 15051901;
```
Dapp deployment block number.
  
**Lines 6-7: Other constants**
```typescript
const STAKING_REWARDS_PROXY = '0x990d156d511d0493a0b7c32d1af97e0c9e352acd';
const RADAR_TOKEN = '0x44709a920fccf795fbc57baa433cc3dd53c44dbe';
```
STAKING_REWARDS_PROXY is address of contract that holds staked tokens;

RADAR_TOKEN is RADAR token contract address.
  
**Line 9: tvl calculation function**
```typescript
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
```
Every integration must export this function. It calculates and returns locked tokens balances. It takes a single parameter **params** of type ITvlParams. The tvl function returns a Promise that resolves to a ITvlReturn.

  **params** is an object which has these attributes:
  - block - block number for which TVL is calculated;
  - chain - provider's chain;
  - provider - provider's name;
  - web3 - web3 object, that let's you connect to blockchain node.
  
**Lines 11-13: block number validation**
```typescript
  if (block < START_BLOCK) {
    return {};
  }
```
If provided block is lower than dapp deployment block, empty object is returned.

**Lines 15-21: TVL calculation**
```typescript
  const proxyBalance = await util.getTokenBalances(
    STAKING_REWARDS_PROXY,
    [RADAR_TOKEN],
    block,
    chain,
    web3,
  );
```
If provided block is not lower than START_BLOCK, the function continues by calling the **getTokenBalances** function from the **util** module. getTokenBalances function connects to blockchain node requests data and returns balances in this format:
```
    [
      {
        token: '0x44709a920fccf795fbc57baa433cc3dd53c44dbe',
        balance: BigNumber { s: 1, e: 24, c: [Array] }
      }
    ]
```

**util** module has many helper functions that makes integrations simplier and more readable. More information can be found [here](https://github.com/dappradar/dappradar-defi-providers/blob/IN-731/src/util/blockchainUtil.ts)

**Line 24: summing balances**
```typescript
  formatter.sumMultiBalanceOf(balances, proxyBalance);
```
**sumMultiBalanceOf** function from the **formatter** module sums provided balances (in this example **balances** object is still empty). Balances are returned in this format:
```
    {
      '0x44709a920fccf795fbc57baa433cc3dd53c44dbe': BigNumber { s: 1, e: 24, c: [ 10716899567, 89084106491755 ] }
    }
```

**Line 25: converting balances to required format**
```typescript
  formatter.convertBalancesToFixed(balances);
```
**convertBalancesToFixed** function from the **formatter** module converts BigNumber objects to strings. Balances are returned in this format:
```
    {
      '0x44709a920fccf795fbc57baa433cc3dd53c44dbe': '1071689956789084106491755'
    }
```

**formatter** module has many helper funcions related with data transformation. More information can be found [here](https://github.com/dappradar/dappradar-defi-providers/blob/IN-731/src/util/formatter.ts)


## Code walk through of Sakeswap DEX protocol integration

This integration calculates TVL of Sakeswap protocol that is Uniswap V2 clone

```typescript
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';

const START_BLOCK = 10932295;
const FACTORY_ADDRESS = '0x75e48C954594d64ef9613AeEF97Ad85370F13807';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );
  formatter.convertBalancesToFixed(balances);
  return { balances, poolBalances };
}

export { tvl };
```

**Line 5: START_BLOCK constant**
```typescript
const START_BLOCK = 10932295;
```
Dapp deployment block number.
  
**Lines 6: FACTORY_ADDRESS constant**
```typescript
const FACTORY_ADDRESS = '0x75e48C954594d64ef9613AeEF97Ad85370F13807';
```
Address of DEX factory. It holds addresses of all DEX pairs that belongs to this protocol.
  
**Line 8: tvl calculation function**
```typescript
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
```
Every integration must export this function. It calculates and returns locked tokens balances. It takes a single parameter **params** of type ITvlParams. The tvl function returns a Promise that resolves to a ITvlReturn.

  **params** is an object which has these attributes:
  - block - block number for which TVL is calculated;
  - chain - provider's chain;
  - provider - provider's name;
  - web3 - web3 object, that let's you connect to blockchain node.
  
**Lines 10-12: block number validation**
```typescript
  if (block < START_BLOCK) {
    return {};
  }
```
If provided block is lower than dapp deployment block, empty object is returned.

**Lines 14-20: TVL and pool balances calculation**
```typescript
  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );
```
If provided block is not lower than START_BLOCK, the function continues by calling the **getTvl** function from the **uniswapV2** module. getTvl function connects to blockchain node and requests all data that is needed to calculate TVL of any Uniswap V2 clone. In addition to TVL it returns **poolBalances** object that holds data of pool balances.

Balances are returned in this format:
```
 {
      '0x066798d9ef0833ccc719076dab77199ecbd178b0': BigNumber { s: 1, e: 25, c: [ 105156604450, 13181649986725 ] },
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': BigNumber { s: 1, e: 19, c: [ 248859, 12216779126148 ] },
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': BigNumber { s: 1, e: 19, c: [ 456801, 34348242586512 ] },
      ...
      '0x0ae055097c6d159879521c384f1d2123d1f195e6': BigNumber { s: 1, e: 15, c: [ 17, 13254539808127 ] },
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': BigNumber { s: 1, e: 6, c: [ 3462705 ] },
      '0xa1d0e215a23d7030842fc67ce582a6afa3ccab83': BigNumber { s: 1, e: 12, c: [ 1444845745234 ] }
}
```
Pool balances are returned in this format:
```
  {
      '0x83970b5570e4cb5fc5e21ef9b9f3c4f8a129c2f2': {
        tokens: [
          '0x066798d9ef0833ccc719076dab77199ecbd178b0',
          '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'
        ],
        balances: [ '66633869142732406456048', '24885912216779126148' ]
      },
      '0xac10f17627cd6bc22719ceebf1fc524c9cfdc255': {
        tokens: [
          '0x066798d9ef0833ccc719076dab77199ecbd178b0',
          '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
        ],
        balances: [ '6269580334864237945077199', '9099834270207947836' ]
      },
      ...
      '0x5f1243bce6290487b76af1d744110c0f3f7bf213': {
        tokens: [
          '0xdac17f958d2ee523a2206206994597c13d831ec7',
          '0xdfc3829b127761a3218bfcee7fc92e1232c9d116'
        ],
        balances: [ '663798', '14395619' ]
      },
      '0xf3fe52b5cd80ec9d470f163d0c938f141e8da4fb': {
        tokens: [
          '0x028a52032a7075a42585c037f069c62b49ebaa3d',
          '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
        ],
        balances: [ '1073794839271839181545164', '48612112952162791' ]
      }
}

**uniswapV2 calculator** is just one of many calculators that can be use to calculate TVL of well known smart contract architectures. More calculators can be found [here](https://github.com/dappradar/dappradar-defi-providers/tree/IN-731/src/util/calculators)

**Line 21: converting balances to required format**
```typescript
  formatter.convertBalancesToFixed(balances);
```
**convertBalancesToFixed** function from the **formatter** module converts BigNumber objects to strings. Balances are returned in this format:
```
    {
      '0x44709a920fccf795fbc57baa433cc3dd53c44dbe': '1071689956789084106491755'
    }
```

**formatter** module has many helper funcions related with data transformation. More information can be found [here](https://github.com/dappradar/dappradar-defi-providers/blob/IN-731/src/util/formatter.ts)

## Contact

Do not hesitate to contact us with any questions. Here is the [discord](https://discord.com/channels/415573887531745281/1059466542162653284)
