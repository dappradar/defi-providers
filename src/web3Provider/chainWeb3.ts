import Web3 from 'web3';
// import solWeb3 from './solana';
// import tzWeb3 from './tezos';
// import hbarWeb3 from './hedera';
// import stxWeb3 from './stacks';
// import nearWeb3 from './near';
// import everWeb3 from './everscale';
import serviceData from '../util/data';

const config = {
  clientConfig: {
    maxReceivedFrameSize: 1000000000,
    maxReceivedMessageSize: 1000000000,
  },
};

export default {
  getWeb3: (chain = 'ethereum', url = null) => {
    const supportChain = serviceData.CHAINS[chain] ? chain : 'ethereum';
    const node_url =
      url || serviceData[`${supportChain.toUpperCase()}_NODE_URL`];

    let web3;

    if (node_url.startsWith('ws')) {
      web3 = new Web3(new Web3.providers.WebsocketProvider(node_url, config));
    } else {
      web3 = new Web3(new Web3.providers.HttpProvider(node_url));
    }

    return web3;
  },
};
