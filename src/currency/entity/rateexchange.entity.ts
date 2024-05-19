import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('exchangerates')
export class ExchangeRateEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column({ unique: true })
    name: string;

    @Column('double')
    value: number
}