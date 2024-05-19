import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrencyService } from './currency.service';

interface IRateCurrency {
    currency: string;
    balance: number;
}

@Controller('currency')
export class CurrencyController {
    constructor(
        private currencyService: CurrencyService
    ) { }

    //Admin
    @Get('rateexchange')
    public async getAllCurrencyBalance() {
        const rateCurrencyList = await this.currencyService.getAllRateCurrency();
        console.log("rateCurrencyList", rateCurrencyList)

        //format
        const responseData = {};
        for (const index in rateCurrencyList) {
            const targetRateCurrency = rateCurrencyList[index];
            responseData[targetRateCurrency.name] = targetRateCurrency.value
        }
        return responseData
    }

    @Patch('rateexchange/:currencyName')
    public async updateRateExchange(@Param("currencyName") currencyName: string, @Body() param: { amount: number }) {
        try {
            await this.currencyService.updateRateExchange(currencyName, param.amount);
            return `update rateExchange: ${currencyName} success`
        } catch (e) {
            throw e
        }
    }

    @Post('rateexchange/:currencyName')
    public async addRateExchange(@Param("currencyName") currencyName: string, @Body() param: { amount: number }) {
        return await this.currencyService.addRateExchange(currencyName, param.amount)
    }


}
