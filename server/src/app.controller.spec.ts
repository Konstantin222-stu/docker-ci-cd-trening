
jest.mock('@nestjs/sequelize', () => ({
  InjectModel: jest.fn(() => () => undefined),
}));

jest.mock('./item.model', () => ({
  Item: class MockItem {},
}));

import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  const itemModel = {
    findAll: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    appController = new AppController(itemModel as any);
  });

  describe('getHealth', () => {
    it('should return API health status', () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        db: 'postgres+sequelize',
      });
    });
  });

  describe('getItems', () => {
    it('should return items sorted by id in ascending order', async () => {
      const items = [
        { id: 1, title: 'Item 1' },
        { id: 2, title: 'Item 2' },
      ];

      itemModel.findAll.mockResolvedValue(items);

      const result = await appController.getItems();

      expect(itemModel.findAll).toHaveBeenCalledWith({
        order: [['id', 'ASC']],
      });

      expect(result).toEqual(items);
    });
  });
});
