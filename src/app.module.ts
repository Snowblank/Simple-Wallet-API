import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { CurrencyModule } from './currency/currency.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WalletEntity } from './currency/entity/wallet.entity';
import { UserEntity } from './user/entity/user.entity';
import { ExchangeRateEntity } from './currency/entity/rateexchange.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the ConfigModule available globally
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (cfgService: ConfigService) => ({
        type: 'mariadb',
        host: cfgService.get("DB_HOSTNAME"),
        port: cfgService.get("DB_PORT"),
        username: cfgService.get("DB_USERNAME"),
        password: cfgService.get("DB_PASSWORD"),
        database: cfgService.get("DB_NAME"),
        entities: [WalletEntity, UserEntity, ExchangeRateEntity],
        synchronize: true
      })
    }),
    UserModule,
    CurrencyModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
