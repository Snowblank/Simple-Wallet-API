import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CurrencyModule } from 'src/currency/currency.module';

@Module({
  imports: [CurrencyModule],
  providers: [UserService],
  controllers: [UserController]
})
export class UserModule {}
