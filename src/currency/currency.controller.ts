import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
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
        const rateCurrency = await this.currencyService.getAllRateCurrency();

        //format
        const responseData = [];
        for (const currency in rateCurrency) {
            const data: IRateCurrency = {
                currency,
                balance: rateCurrency[currency]
            }
            responseData.push(data);
        }
        return { result: responseData }
    }

    @Patch('rateexchange/:currencyName')
    public async updateRateExchange(@Param("currencyName") currencyName: string, @Body() param: { amount: number }) {
        try {
            await this.currencyService.updateRateExchange(currencyName, param.amount);
            return "update rate-exchange success"
        } catch (e) {
            throw e
        }
    }


}
