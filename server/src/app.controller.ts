import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Item } from './item.model';

@Controller()
export class AppController {
  constructor(
    @InjectModel(Item)
    private readonly itemModel: typeof Item,
  ) {}

  @Get()
  getHealth() {
    return { status: 'ok', db: 'postgres+sequelize' };
  }

  @Get('items')
  getItems() {
    return this.itemModel.findAll({ order: [['id', 'ASC']] });
  }
}