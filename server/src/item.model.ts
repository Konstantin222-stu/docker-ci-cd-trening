import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'items', timestamps: false })
export class Item extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare title: string;
}