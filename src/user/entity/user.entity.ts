import { WalletEntity } from "src/currency/entity/wallet.entity";
import { Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column({ unique: true })
    name: string;

    @Column()
    password: string;

    @OneToMany(() => WalletEntity, wallet => wallet.user)
    wallets: WalletEntity[];
}