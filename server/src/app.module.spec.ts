
jest.mock('@nestjs/config', () => ({
  ConfigModule: {
    forRoot: jest.fn(() => class MockConfigModule {}),
  },
  ConfigService: class MockConfigService {},
}));

jest.mock('@nestjs/sequelize', () => ({
  InjectModel: jest.fn(() => () => undefined),
  SequelizeModule: {
    forRootAsync: jest.fn(() => class MockSequelizeModule {}),
    forFeature: jest.fn(() => class MockSequelizeFeatureModule {}),
  },
}));

jest.mock('./app.controller', () => ({
  AppController: class MockAppController {},
}));

jest.mock('./item.model', () => ({
  Item: class MockItem {},
}));

import { AppModule } from './app.module';

describe('AppModule', () => {
  let appModule: AppModule;

  const itemModel = {
    count: jest.fn(),
    bulkCreate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    appModule = new AppModule(itemModel as any);
  });

  describe('onModuleInit', () => {
    it('should create initial items when database is empty', async () => {
      itemModel.count.mockResolvedValue(0);
      itemModel.bulkCreate.mockResolvedValue([]);

      await appModule.onModuleInit();

      expect(itemModel.count).toHaveBeenCalledTimes(1);
      expect(itemModel.bulkCreate).toHaveBeenCalledWith([
        { title: 'Запись из PostgreSQL #1' },
        { title: 'Запись из PostgreSQL #2' },
        { title: 'Запись из PostgreSQL #3 (живёт в Volume)' },
      ]);
    });

    it('should not create items when database already contains records', async () => {
      itemModel.count.mockResolvedValue(3);

      await appModule.onModuleInit();

      expect(itemModel.count).toHaveBeenCalledTimes(1);
      expect(itemModel.bulkCreate).not.toHaveBeenCalled();
    });

    it('should propagate an error when counting items fails', async () => {
      itemModel.count.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(appModule.onModuleInit()).rejects.toThrow(
        'Database connection failed',
      );

      expect(itemModel.bulkCreate).not.toHaveBeenCalled();
    });
  });
});
