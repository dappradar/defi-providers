import Web3 from 'web3';
import solWeb3 from './solana';
import tzWeb3 from './tezos';
import hbarWeb3 from './hedera';
import stxWeb3 from './stacks';
import nearWeb3 from './near';
import everWeb3 from './everscale';
import serviceData from '../data';

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
    if (supportChain == 'everscale') {
      web3 = everWeb3;
      web3.nodeUrl = node_url;
    } else if (supportChain == 'hedera') {
      web3 = hbarWeb3;
      web3.nodeUrl = node_url;
    } else if (supportChain == 'near') {
      web3 = nearWeb3;
      web3.nodeUrl = node_url;
    } else if (supportChain == 'solana') {
      web3 = solWeb3;
      web3.nodeUrl = node_url;
    } else if (supportChain == 'stacks') {
      web3 = stxWeb3;
      web3.nodeUrl = node_url;
    } else if (supportChain == 'tezos') {
      web3 = tzWeb3;
      web3.init(node_url);
    } else {
      if (node_url.startsWith('ws')) {
        web3 = new Web3(new Web3.providers.WebsocketProvider(node_url, config));
      } else {
        web3 = new Web3(new Web3.providers.HttpProvider(node_url));
      }
    }

    return web3;
  },
};
