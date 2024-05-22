import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CurrencyModule } from '../currency/currency.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { WalletEntity } from '../currency/entity/wallet.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule,
    TypeOrmModule.forFeature([UserEntity, WalletEntity]),
    CurrencyModule
  ],
  providers: [UserService],
  controllers: [UserController]
})
export class UserModule { }
