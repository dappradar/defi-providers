import { Test, TestingModule } from '@nestjs/testing';
import { FactoryService } from './factory.service';
import { AppModule } from '../app.module';
import { Tezos } from '../web3Provider/tezos';

describe('providers', () => {
  let factoryService: FactoryService;
  let tezos: Tezos;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    factoryService = module.get(FactoryService);
    await factoryService.onModuleInit();
    tezos = module.get(Tezos);
  });

  /*  describe('aurora', () => {
    it('aurigami block: 80260740', async () => {
      const { balances } = await factoryService.getTvl({
        provider: 'aurigami',
        chain: 'aurora',
        query: { block: '80260740', date: '0' },
      });
      expect(balances).toEqual({
        '0xb12bfca5a55806aaf64e99521918a4bf0fc40802': '1701698217203',
        '0xc9bdeed33cd01541e1eed10f90519d2c06fe3feb': '620827366841303074624',
        '0xf4eb217ba2454613b15dbdea6e5f22276410e89e': '3284141927',
        '0x4988a896b1227218e4a686fde5eabdcabd91571f': '753680071250',
        '0xe3520349f477a5f6eb06107066048508498a291b': '34013113796702948047',
        '0xc42c30ac6cc15fac9bd938618bcaa1a1fae8501d':
          '249149075596122393035185496636',
        '0x07f9f7f963c5cd2bbffd30ccfb964be114332e30':
          '529358015478955817355719685377',
        '0x8bec47865ade3b172a928df8f990bc7f2a3b9f79': '27934052027757833749135',
        '0xfa94348467f64d5a457f75f8bc40495d33c65abb':
          '1080246373909790689993847',
        '0x09c9d464b58d96837f8d8b6f4d9fe4ad408d3a4f':
          '199562890296646164300264174',
        '0x5183e1b1091804bc2602586919e6880ac1cf2896': '1462156878911252687019',
      });
    });
    it('auroraplus block: 80186813', async () => {
      const { balances } = await factoryService.getTvl({
        provider: 'auroraplus',
        chain: 'aurora',
        query: { block: '80186813', date: '0' },
      });
      expect(balances).toEqual({
        '0x8bec47865ade3b172a928df8f990bc7f2a3b9f79':
          '23420161023997237558857267',
      });
    });
  });

  describe('avalanche', () => {
    it('aave block: 23370388', async () => {
      const { balances } = await factoryService.getTvl({
        provider: 'aave',
        chain: 'avalanche',
        query: { block: '23370388', date: '0' },
      });
      expect(balances).toEqual({
        '0xd586e7f844cea2f87f50152665bcbc2c279d8d70':
          '22887875998341266141081534',
        '0x5947bb275c521040051d82396192181b413227a3':
          '239219843948396511112293',
        '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e': '129310978686978',
        '0x50b7545627a5162f82a992c33b87adc75187b218': '173883535077',
        '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab': '38794039440157693102819',
        '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7': '25443493581760',
        '0x63a72806098bd3d9520cc43356dd78afe5d386d9': '10537123225877654783815',
        '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7':
          '1846310368905406256734431',
        '0x2b2c81e08f1af8835a78bb2a90ae924ace0ea4be':
          '771998421105064576392043',
        '0xd24c2ad096400b6fbcd2ad8b24e7acbc21a1da64': '10536620294232566847866',
        '0x5c49b268c9841aff1cc3b0a418ff5c3442ee3f3b': '184730952176462766373',
        '0x152b9d0fdc40c096757f570a51e494bd4b943e50': '216396114063',
        '0xc7198437980c041c805a1edcba50c1ce5db95118': '1356781757156',
        '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664': '7029438939564',
      });
    });
    it('alpha block: 23412552', async () => {
      const { balances } = await factoryService.getTvl({
        provider: 'alpha',
        chain: 'avalanche',
        query: { block: '23412552', date: '0' },
      });
      expect(balances).toEqual({
        '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7':
          '491517113005861091258220.24912874985350448278',
        '0xc7198437980c041c805a1edcba50c1ce5db95118':
          '927139836190.41396629439721491318',
        '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e':
          '2290085929341.33322517788873781183',
        '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664':
          '3316858740786.88081896728776697492',
        '0xd586e7f844cea2f87f50152665bcbc2c279d8d70':
          '268323443352563677638794.58116093092566013331',
        '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab':
          '194473835346371495135.20525047278698269334',
        '0x50b7545627a5162f82a992c33b87adc75187b218':
          '3237443153.23076668620242061535',
        '0x130966628846bfd36ff31a822705796e8cb8c18d':
          '129817403602815847011493.3068010407111510088',
        '0x2147efff675e4a4ee1c2f918d181cdbd7a8e208f':
          '430683032386342546712885.4351087884646536134',
        '0x5947bb275c521040051d82396192181b413227a3':
          '17755245397120712312.94424092575760948836',
        '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7':
          '786303274996.32347392054715894187',
        '0xb599c3590f42f8f995ecfa0f85d2980b76862fc1':
          '487262830.3255116774057032308',
      });
    });
  });

  describe('celo', () => {
    it('immortal block: 16584054', async () => {
      const { balances } = await factoryService.getTvl({
        provider: 'immortal',
        chain: 'celo',
        query: { block: '16584054', date: '0' },
      });
      expect(balances).toEqual({
        '0x918146359264c492bd6934071c6bd31c854edbc3':
          '77415191059008427734358.11573153686061103281',
        '0xe685d21b7b0fc7a248a6a8e03b8db22d013aa2ee':
          '748561656261812.13521365750601670909',
      });
    });
    it('impactmarket block: 16584079', async () => {
      const { balances } = await factoryService.getTvl({
        provider: 'impactmarket',
        chain: 'celo',
        query: { block: '16584079', date: '0' },
      });
      expect(balances).toEqual({
        '0x46c9757c5497c5b1f2eb73ae79b6b67d119b0b58':
          '2000000000000000000000000000',
      });
    });
  });

  describe('ethereum', () => {
    it('yearn block: 16145650', async () => {
      const { balances } = await factoryService.getTvl({
        provider: 'yearn',
        chain: 'ethereum',
        query: { block: '16145650', date: '0' },
      });
      const responseKeys = Object.keys(balances);
      expect(responseKeys).toContain(
        '0x0000000000085d4780b73119b644ae5ecd22b376',
      );
      expect(responseKeys.length).toBeGreaterThan(0);
    });
    it('wing block: 16145650', async () => {
      const { balances } = await factoryService.getTvl({
        provider: 'wing',
        chain: 'ethereum',
        query: { block: '16145650', date: '0' },
      });
      const responseKeys = Object.keys(balances);
      expect(responseKeys).toContain(
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      );
      expect(responseKeys.length).toBeGreaterThan(0);
    });
  });

  describe('celo', () => {
    it('immortal block: 16584054', async () => {
      const { balances } = await factoryService.getTvl({
        provider: 'immortal',
        chain: 'celo',
        query: { block: '16584054', date: '0' },
      });
      expect(balances).toEqual({
        '0x918146359264c492bd6934071c6bd31c854edbc3':
          '77415191059008427734358.11573153686061103281',
        '0xe685d21b7b0fc7a248a6a8e03b8db22d013aa2ee':
          '748561656261812.13521365750601670909',
      });
    });
    it('impactmarket block: 16584079', async () => {
      const { balances } = await factoryService.getTvl({
        provider: 'impactmarket',
        chain: 'celo',
        query: { block: '16584079', date: '0' },
      });
      expect(balances).toEqual({
        '0x46c9757c5497c5b1f2eb73ae79b6b67d119b0b58':
          '2000000000000000000000000000',
      });
    });
  });*/

  describe('tezos', () => {
    it('alien block: 2955365', async () => {
      await tezos.onModuleInit();
      const { balances } = await factoryService.getTvl({
        provider: 'alien',
        chain: 'tezos',
        query: { block: '2955365', date: '0' },
      });
      expect(balances).toEqual({
        KT19DUSZw7mfeEATrbWVPHRrWNVbNnmfFAE6:
          '249715664088144.12718220767259870011',
        KT1H5KJDxuM9DURSfttepebb6Cn7GbvAAT45:
          '165878849369.74953586084234066502',
        KT1XPFjZqCULSnqfKaaYy8hJjeY63UNSGwXg_0: '497068053.1162191356759715904',
        KT193D4vozYnhGJQVtw7CoxxqphqUEEwK6Vb_0:
          '241078174.13193946425867717656',
      });
    }, 1000000);
    it('plenty block: 2955365', async () => {
      await tezos.onModuleInit();
      const { balances } = await factoryService.getTvl({
        provider: 'wrapprotocol',
        chain: 'tezos',
        query: { block: '2955365', date: '0' },
      });
      expect(balances).toEqual({
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_0: '36043709917618147490',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_1: '289868031771383495604700',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_2: '4020041',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_3: '7798299202315263415',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_4: '11089733753413',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_5: '104173410141251221065552',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_6: '30009667729248861709',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_7: '59699467914408847249',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_8: '248321066328',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_9: '228191800012206869815',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_10: '14203355884512846375162',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_11: '101859295633637265101693',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_12: '855327737194690250',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_13: '42615976704141157740',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_14: '2866084783658307381347',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_15: '396484842089866656148',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_16: '1003579566448386701175',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_17: '967101803925',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_18: '120852313751',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_19: '5979654498',
        KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_20: '258851288718572944362',
        KT1LRboPna9yQY9BrjtQYDS1DVxhKESK4VVd: '201825249886635',
      });
    }, 1000000);
  });
});
