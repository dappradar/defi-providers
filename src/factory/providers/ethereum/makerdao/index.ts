import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import CDP_MANAGER_ABI from './abi/cdpManager.json';
import IKL_REGISTRY_ABI from './abi/ilkRegistry.json';
import MCD_MONITOR_V2_ABI from './abi/mcdMonitorV2.json';
import G_UNI_ABI from './abi/gUni.json';

const START_BLOCK = 14583413;
const BLOCK_LIMIT = 10000;

const API_URL = process.env.SUMMERFI_CONFIRMED_VAULTS_API;
const CONTRACTS = {
  AutomationV1Contract: '0x6E87a7A0A03E51A741075fDf4D1FCce39a4Df01b',
  McdMonitorV2: '0xa59d5E94BFE605A9a4aC7e02f5380e02061c8dd2',
  CdpManager: '0x5ef30b9986345249bc32d8928b7ee64de9435e39',
  IlkRegistry: '0x5a464c28d19848f44199d003bef5ecc87d090f87',
};
const G_UNI_DAI_USDC_ADDRESS = '0x50379f632ca68d36e50cfbc8f78fe16bd1499d1e';

const LOGS_TOPIC = {
  TriggerAdded:
    '0xcb616360dd177f28577e33576c8ac7ffcc1008cba7ac2323e0b2f170faf60bd2',
  TriggerExecuted:
    '0xc10f224f2f1ceab5e36f97effaa05c4b75eccbecd77b65bfb20c484de9096cdd',
  TriggerRemoved:
    '0xb4a1fc324bd863f8cd42582bebf2ce7f2d309c6a84bf371f28e069f95a4fa9e1',
};

async function getAutomationCdpIdList(block, chain, provider, web3) {
  let cache: {
    start: number;
    cdpIdList: number[];
  } = { start: START_BLOCK, cdpIdList: [] };
  try {
    cache = await basicUtil.readFromCache('cache.json', chain, provider);
  } catch {}

  const cdpIdList = new Set(cache.cdpIdList);

  const triggerEvents = [];
  for (
    let i = Math.max(cache.start, START_BLOCK);
    i < block;
    i += BLOCK_LIMIT
  ) {
    const [triggerAddedLogs, triggerRemovedLogs, triggerExecutedLogs] =
      await Promise.all(
        Object.keys(LOGS_TOPIC).map((key) =>
          util.getLogs(
            i,
            Math.min(i + BLOCK_LIMIT, block),
            LOGS_TOPIC[key],
            CONTRACTS.AutomationV1Contract,
            web3,
          ),
        ),
      );

    triggerAddedLogs.output.forEach((log) => {
      const trigger = new BigNumber(
        `0x${log.topics[1].substring(26, 66)}`,
      ).toFixed();
      const cdp = new BigNumber(
        `0x${log.topics[3].substring(26, 66)}`,
      ).toFixed();
      const action = `triggerAdded`;

      triggerEvents.push({ cdp, trigger, action });
    });

    triggerRemovedLogs.output.forEach((log) => {
      const trigger = new BigNumber(
        `0x${log.topics[2].substring(26, 66)}`,
      ).toFixed();
      const cdp = new BigNumber(
        `0x${log.topics[1].substring(26, 66)}`,
      ).toFixed();
      const action = `triggerRemoved`;

      triggerEvents.push({ cdp, trigger, action });
    });

    triggerExecutedLogs.output.forEach((log) => {
      const trigger = new BigNumber(
        `0x${log.topics[1].substring(26, 66)}`,
      ).toFixed();
      const cdp = new BigNumber(
        `0x${log.topics[2].substring(26, 66)}`,
      ).toFixed();
      const action = `triggerExecuted`;

      triggerEvents.push({ cdp, trigger, action });
    });
  }

  triggerEvents.sort((a, b) => a.trigger - b.trigger);

  triggerEvents.forEach((event) => {
    const { cdp, action } = event;
    if (action === 'triggerAdded') {
      cdpIdList.add(cdp);
    } else if (action === 'triggerRemoved' || action === 'triggerExecuted') {
      cdpIdList.delete(cdp);
    }
  });

  cache.start = block;
  cache.cdpIdList = Array.from(cdpIdList);
  await basicUtil.saveIntoCache(cache, 'cache.json', chain, provider);

  return cdpIdList;
}

async function automationTvl(cdpIdList, balances, block, chain, web3) {
  const cdpIds = [...cdpIdList];

  const ilkNames = await util.executeMultiCallsOfTarget(
    CONTRACTS.CdpManager,
    CDP_MANAGER_ABI,
    'ilks',
    cdpIds,
    block,
    chain,
    web3,
  );

  const cdpIlkIds = {};
  ilkNames.forEach((val, idx) => (cdpIlkIds[cdpIds[idx]] = val));
  const ilkIds = [...new Set(ilkNames)];
  const tokens = (
    await util.executeMultiCallsOfTarget(
      CONTRACTS.IlkRegistry,
      IKL_REGISTRY_ABI,
      'info',
      ilkIds,
      block,
      chain,
      web3,
    )
  ).map((i) => i[4]);
  const decimals = await util.executeCallOfMultiTargets(
    tokens,
    ERC20_ABI,
    'decimals',
    [],
    block,
    chain,
    web3,
  );

  const collData = await util.executeMultiCallsOfTarget(
    CONTRACTS.McdMonitorV2,
    MCD_MONITOR_V2_ABI,
    'getCdpInfo',
    cdpIds.map((i) => [i, cdpIlkIds[i]]),
    block,
    chain,
    web3,
  );
  collData.forEach((coll, i) => {
    const idx = ilkIds.indexOf(ilkNames[i]);
    balances[String(tokens[idx]).toLowerCase()] = BigNumber(
      balances[tokens[idx].toLowerCase()] || 0,
    ).plus(coll['0'] / 10 ** (18 - decimals[idx]));
  });
}

async function convertGUniToUnderlyings(balances, block, chain, web3) {
  if (balances[G_UNI_DAI_USDC_ADDRESS]) {
    const [totalSupply, underlyingBalances, token0, token1] = await Promise.all(
      await util.executeDifferentCallsOfTarget(
        G_UNI_DAI_USDC_ADDRESS,
        G_UNI_ABI,
        ['totalSupply', 'getUnderlyingBalances', 'token0', 'token1'],
        [[], [], [], []],
        block,
        chain,
        web3,
      ),
    );

    const ratio = new BigNumber(balances[G_UNI_DAI_USDC_ADDRESS]).dividedBy(
      totalSupply,
    );
    balances[token0.toLowerCase()] = BigNumber(
      balances[token0.toLowerCase()] || 0,
    ).plus(
      new BigNumber(underlyingBalances.amount0Current).multipliedBy(ratio),
    );
    balances[token1.toLowerCase()] = BigNumber(
      balances[token1.toLowerCase()] || 0,
    ).plus(
      new BigNumber(underlyingBalances.amount1Current).multipliedBy(ratio),
    );
    delete balances[G_UNI_DAI_USDC_ADDRESS];
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  let balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  const confirmedSummerFiMakerVaults = await fetch(API_URL).then((res) =>
    res.json(),
  );

  const confirmedSummerFiMakerVaultsArray = [
    ...Object.keys(confirmedSummerFiMakerVaults),
  ];
  const confirmedSummerFiMakerVaultsSet = new Set(
    confirmedSummerFiMakerVaultsArray,
  );

  const cdpIdList = await getAutomationCdpIdList(block, chain, provider, web3);

  [...cdpIdList].forEach((cdpId) => {
    confirmedSummerFiMakerVaultsSet.delete(cdpId.toString());
  });

  const filteredVaultsList = [...confirmedSummerFiMakerVaultsSet].filter(
    (i) => {
      const [startBlock] = confirmedSummerFiMakerVaults[i];
      return block > startBlock;
    },
  );

  const cdpIds = [...new Set(filteredVaultsList)];

  const ilkNames = await util.executeMultiCallsOfTarget(
    CONTRACTS.CdpManager,
    CDP_MANAGER_ABI,
    'ilks',
    cdpIds,
    block,
    chain,
    web3,
  );

  const cdpIlkIds = {};
  ilkNames.forEach((val, idx) => (cdpIlkIds[cdpIds[idx]] = val));
  const ilkIds = [...new Set(ilkNames)];
  const tokens = (
    await util.executeMultiCallsOfTarget(
      CONTRACTS.IlkRegistry,
      IKL_REGISTRY_ABI,
      'info',
      ilkIds,
      block,
      chain,
      web3,
    )
  ).map((i) => i[4]);
  const decimals = await util.executeCallOfMultiTargets(
    tokens,
    ERC20_ABI,
    'decimals',
    [],
    block,
    chain,
    web3,
  );

  const collData = await util.executeMultiCallsOfTarget(
    CONTRACTS.McdMonitorV2,
    MCD_MONITOR_V2_ABI,
    'getCdpInfo',
    filteredVaultsList.map((i) => [i, cdpIlkIds[i]]),
    block,
    chain,
    web3,
  );
  collData.forEach((coll, i) => {
    const idx = ilkIds.indexOf(ilkNames[i]);
    if (idx === -1) {
      return;
    }
    balances[String(tokens[idx]).toLowerCase()] = BigNumber(
      balances[tokens[idx].toLowerCase()] || 0,
    ).plus(coll['0'] / 10 ** (18 - decimals[idx]));
  });

  await automationTvl(cdpIdList, balances, block, chain, web3);

  await convertGUniToUnderlyings(balances, block, chain, web3);

  const tokenBalances = {};
  Object.keys(balances).forEach(function (key) {
    tokenBalances[key] = BigNumber(balances[key]);
  });

  balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
