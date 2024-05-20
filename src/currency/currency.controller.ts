import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { AuthGuard } from 'src/guard/auth.guard';
import { ERoleUser, RoleGuard as RoleGuard, Roles } from 'src/guard/role.guard';
@Controller('currency')
export class CurrencyController {
    constructor(
        private currencyService: CurrencyService
    ) { }

    //Admin
    @UseGuards(AuthGuard, RoleGuard)
    @Roles(ERoleUser.ADMIN)
    @Get('rateexchange')
    public async getAllRateCurrencyBalance() {
        const rateCurrencyList = await this.currencyService.getAllRateCurrency();

        //format
        const responseData = {};
        for (const index in rateCurrencyList) {
            const targetRateCurrency = rateCurrencyList[index];
            responseData[targetRateCurrency.name] = targetRateCurrency.value
        }
        return responseData
    }

    @UseGuards(AuthGuard, RoleGuard)
    @Roles(ERoleUser.ADMIN)
    @Patch('rateexchange/:currencyName')
    public async updateRateExchange(@Param("currencyName") currencyName: string, @Body() param: { amount: number }) {
        try {
            await this.currencyService.updateRateExchange(currencyName, param.amount);
            return `update rateExchange: ${currencyName} success`
        } catch (e) {
            throw e
        }
    }

    @UseGuards(AuthGuard, RoleGuard)
    @Roles(ERoleUser.ADMIN)
    @Post('rateexchange/:currencyName')
    public async addRateExchange(@Param("currencyName") currencyName: string, @Body() param: { amount: number }) {
        return await this.currencyService.addRateExchange(currencyName, param.amount)
    }
}
