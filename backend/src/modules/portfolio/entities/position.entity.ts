import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';

@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  portfolioId: string;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.positions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  portfolio: Portfolio;

  @Column()
  symbol: string;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  quantity: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  averagePrice: string;
}
