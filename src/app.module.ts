import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { CurrencyModule } from './currency/currency.module';

@Module({
  imports: [UserModule, CurrencyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
