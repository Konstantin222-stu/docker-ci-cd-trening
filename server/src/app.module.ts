import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InjectModel, SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { Item } from './item.model';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_DATABASE', 'docker_lab'),
        models: [Item],
        autoLoadModels: true,
        synchronize: true, // удобно для учебного стенда; в проде лучше миграции
      }),
    }),
    SequelizeModule.forFeature([Item]),
  ],
  controllers: [AppController],
})
export class AppModule implements OnModuleInit {
  constructor(
    @InjectModel(Item)
    private readonly itemModel: typeof Item,
  ) {}

  async onModuleInit() {
    const count = await this.itemModel.count();
    if (count === 0) {
      await this.itemModel.bulkCreate([
        { title: 'Запись из PostgreSQL #1' },
        { title: 'Запись из PostgreSQL #2' },
        { title: 'Запись из PostgreSQL #3 (живёт в Volume)' },
      ]);
    }
  }
}