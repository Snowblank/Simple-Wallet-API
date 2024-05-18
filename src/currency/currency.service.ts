import { Injectable } from '@nestjs/common';

type TRateCurrency = { [key: string]: number };

@Injectable()
export class CurrencyService {
    private currencyRate: TRateCurrency = { 
        XRP: 10 
    }

    constructor() { }

    public async getAllRateCurrency() {
        return this.currencyRate;
    }
    

    public async updateRateExchange(targetCurrency: string, amountUSD: number) {

        if(this.currencyRate[targetCurrency] == null){
            throw new Error("currency not found")
        }

        if(isNaN(amountUSD) || amountUSD <= 0) {
            throw new Error("amount invalid data")
        }

        this.currencyRate[targetCurrency] = amountUSD;
    }

}
