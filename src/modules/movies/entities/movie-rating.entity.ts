import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Movie } from './movie.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class MovieRating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 2, scale: 1 })
  rating: number;

  @ManyToOne(() => Movie, (movie) => movie.ratings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  movie: Movie;

  @ManyToOne(() => User, (user) => user.ratings)
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
