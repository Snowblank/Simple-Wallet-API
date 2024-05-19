import { UserEntity } from "src/user/entity/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('wallets')
export class WalletEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column()
    currency: string;
    
    @Column()
    value: number;
    
    @ManyToOne(() => UserEntity, user => user.wallets)
    user: UserEntity;
}