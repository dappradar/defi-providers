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

After adding the new provider, you can test it with [Bloomrpc](https://github.com/bloomrpc/bloomrpc) or [integration testing](https://github.com/dappradar/dappradar-defi-providers/blob/master/src/factory/factory.spec.ts).

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
  return { balances };
}

export { tvl };
```

**Line 5: START_BLOCK constant**

Dapp deployment block number.
  
**Lines 6-7: Other constants**

STAKING_REWARDS_PROXY is address of contract that holds staked tokens;

RADAR_TOKEN is RADAR token contract address.
  
**Line 9: tvl calculation function**

Every integration must export this function. It calculates and returns locked tokens balances. It takes a single parameter **params** of type ITvlParams. The tvl function returns a Promise that resolves to a ITvlReturn.

  **params** is an object which has these attributes:
  - block - block number for which TVL is calculated;
  - chain - provider's chain;
  - provider - provider's name;
  - web3 - web3 object, that let's you connect to blockchain node.
  
**Lines 11-13: block number validation**

If provided block is lower than dapp deployment block, empty object is returned.

**Lines 15-21: TVL calculation**

If provided block is not lower than START_BLOCK, the function continues by calling the **getTokenBalances** function from the **util** module. getTokenBalances function connects to blockchain node request data and returns balances in this format:
```
    [
      {
        token: '0x44709a920fccf795fbc57baa433cc3dd53c44dbe',
        balance: BigNumber { s: 1, e: 24, c: [Array] }
      }
    ]
```

**util** module has many helper functions that makes integrations simplier and more readable. More information can be found [here](https://github.com/dappradar/dappradar-defi-providers/blob/IN-731/src/util/blockchainUtil.ts)

**Line 24: converting balances to required format**

**sumMultiBalanceOf** function from the **formatter** module sums provided balances (in this example **balances** object is still empty) and converts BigNumber objects to strings. Balances are returned in this format:
```
    {
      '0x44709a920fccf795fbc57baa433cc3dd53c44dbe': '1071689956789084106491755'
    }
```

**formatter** module has many helper funcions related with data transformation. More information can be found [here](https://github.com/dappradar/dappradar-defi-providers/blob/IN-731/src/util/formatter.ts)

## Contact

Do not hesitate to contact us with any questions. Here is the [discord](https://discord.com/channels/415573887531745281/1059466542162653284)
