import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Genre } from './genre.entity';
import { MovieRating } from './movie-rating.entity';
import { Watchlist } from './watchlist.entity';

@Entity()
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  tmdbId: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  overview: string;

  @Column({ nullable: true })
  posterPath: string;

  @Column({ nullable: true })
  backdropPath: string;

  @Column({ type: 'date', nullable: true })
  releaseDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  popularity: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 0 })
  voteAverage: number;

  @Column({ type: 'bigint', default: 0 })
  voteCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 0 })
  userRatingAverage: number;

  @Column({ default: 0 })
  userRatingCount: number;

  @ManyToMany(() => Genre, { eager: true })
  @JoinTable()
  genres: Genre[];

  @OneToMany(() => MovieRating, (rating) => rating.movie)
  ratings: MovieRating[];

  @OneToMany(() => Watchlist, (watchlist) => watchlist.movie)
  watchlists: Watchlist[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
