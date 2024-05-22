import { BadRequestException, Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ETypeAccount, UserService } from './user.service';
import { AuthGuard } from '../guard/auth.guard';
import { ERoleUser, RoleGuard, Roles } from '../guard/role.guard';
import { Request } from 'express';

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

interface ICreateUserAccountRequest {
    username: string;
    password: string;
    role: ETypeAccount;
}

interface ILoginUserRequest {
    username: string;
    password: string;
}

interface IRequestData extends Request {
    user: {
        role: ERoleUser;
        name: string;
        iat: number;
        exp: number;
    }
}

@Controller('user')
export class UserController {
    constructor(
        private userService: UserService
    ) { }

    //Admin Role
    @UseGuards(AuthGuard, RoleGuard)
    @Roles(ERoleUser.ADMIN)
    @Get('balance')
    public async getAllTotalBalance(){
        const response = await this.userService.getAllTotalBalance();
        return response;
    }

    @UseGuards(AuthGuard, RoleGuard)
    @Roles(ERoleUser.ADMIN)
    @Patch('balance')
    public async updateCurrencyBalanceByUser(@Body() param: IUpdateBalanceRequest) {
        const currentBalance = await this.userService.updateCurrencyBalanceByUser(param.username, param.currency, param.value)
        return `update currencyBalance user => ${param.username} currency: ${param.currency} balance: ${currentBalance}`
    }

    //User Role
    @UseGuards(AuthGuard, RoleGuard)
    @Roles(ERoleUser.USER)
    @Post('transfer/same')
    public async transferSameCurrencyToOther(@Req() req: IRequestData, @Body() param: ITransferCurrencySameRequest) {
            const withdrawalUser = req.user.name;
            if(withdrawalUser == param.deposit_user){
                throw new BadRequestException("can't transfer in same wallet")
            }
            const response = await this.userService.transferSameCurrencyToOther(withdrawalUser, param.deposit_user, param.currency, param.value)
            return response
    }

    @UseGuards(AuthGuard, RoleGuard)
    @Roles(ERoleUser.USER)
    @Post('transfer/other')
    public async transferOtherCurrencyToOther(@Req() req: IRequestData, @Body() param: ITransferCurrencyOtherRequest) {
        const withdrawalUser = req.user.name;
        const response = await this.userService.transferOtherCurrencyToOther(withdrawalUser, param.withdrawal_currency, param.deposit_user, param.deposit_currency, param.value)
        return response
    }

    @Post('account')
    public async createAccount(@Body() param: ICreateUserAccountRequest) {
        await this.userService.createUser(param.username, param.password, param.role)
        return "createAccount Success:"
    }

    @Post('login')
    public async loginUser(@Body() param: ILoginUserRequest) {
        const token = await this.userService.loginUser(param.username, param.password)
        return { token }
    }

}
