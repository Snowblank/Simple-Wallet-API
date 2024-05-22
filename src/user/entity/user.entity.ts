import { WalletEntity } from "../../currency/entity/wallet.entity";
import { Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { ETypeAccount } from "../user.service";

@Entity('users')
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column()
    password: string;

    @Column('int')
    account_type: ETypeAccount;

    @OneToMany(() => WalletEntity, wallet => wallet.user, { eager: true, nullable: true })
    wallets: WalletEntity[];
}