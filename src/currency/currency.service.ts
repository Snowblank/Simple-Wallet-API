import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExchangeRateEntity } from './entity/rateexchange.entity';
import { Repository } from 'typeorm';

type TRateCurrency = { [key: string]: number };

@Injectable()
export class CurrencyService {

    constructor(
        @InjectRepository(ExchangeRateEntity)
        private exchangeRateRepositoty: Repository<ExchangeRateEntity>
    ) { }

    public async getAllRateCurrency() {
        const result = await this.exchangeRateRepositoty.find();
        return result;
    }


    public async updateRateExchange(targetCurrency: string, amountUSD: number) {
        if (isNaN(amountUSD) || amountUSD <= 0) {
            throw new Error("amount invalid data")
        }
        const updateResult = await this.exchangeRateRepositoty.update({ name: targetCurrency }, { value: amountUSD });
        if (updateResult.affected < 1) {
            throw new Error(`can't update currency:${targetCurrency}`)
        }
    }

    public async addRateExchange(currencyName: string, amountUSD: number) {
        const exchangeRateData = await this.exchangeRateRepositoty.findOne({ where: { name: currencyName } });
        if (exchangeRateData) {
            throw new Error("currency have already")
        }

        if (isNaN(amountUSD) || amountUSD <= 0) {
            throw new Error("amount invalid data")
        }

        const rateExchangeRepo = this.exchangeRateRepositoty.create({ name: currencyName, value: amountUSD });
        const result = await this.exchangeRateRepositoty.save(rateExchangeRepo);
        return result;
    }

}
