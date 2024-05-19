import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CurrencyModule } from 'src/currency/currency.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { WalletEntity } from 'src/currency/entity/wallet.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard } from 'src/guard/auth.guard';

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
