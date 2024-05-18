import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';

interface IUpdateBalanceRequest {
    username: string;
    currency: string;
    value: number;
}

interface ITransferCurrencySameRequest {
    deposit_user: string;
    currency: string;
    value: number;
}

interface ITransferCurrencyOtherRequest {
    deposit_user: string;
    deposit_currency: string;
    withdrawal_currency: string;
    value: number;
}

@Controller('user')
export class UserController {
    constructor(
        private userService: UserService
    ) { }

    //Admin Role
    @Patch('balance')
    public async updateCurrencyBalanceByUser(@Body() param: IUpdateBalanceRequest) {
        const currentBalance = await this.userService.updateCurrencyBalanceByUser(param.username, param.currency, param.value)
        return `update currencyBalance user => ${param.username} currency: ${param.currency} balance: ${currentBalance}`
    }

    //User Role
    @Post('transfer/same')
    public async transferSameCurrencyToOther(@Body() param: ITransferCurrencySameRequest) {
        const withdrawalUser = "" //using JWT
        const response = await this.userService.transferSameCurrencyToOther(withdrawalUser, param.deposit_user, param.currency, param.value)
        return response
    }

    @Post('transfer/other')
    public async transferOtherCurrencyToOther(@Body() param: ITransferCurrencyOtherRequest) {
        const withdrawalUser = "" //using JWT
        const response = await this.userService.transferOtherCurrencyToOther(withdrawalUser, param.withdrawal_currency, param.deposit_user, param.deposit_currency, param.value)
        return response
    }

    @Post('login')
    public async loginUser() {
        return "login user success"
    }

}
