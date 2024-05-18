import { Injectable } from '@nestjs/common';
import { CurrencyService } from 'src/currency/currency.service';

interface IUser {
    username: string;
    password: string;
    balance: { [currencyName: string]: number }
}

@Injectable()
export class UserService {
    private userData: IUser[] = [
        {
            username: "Test1",
            password: "1234",
            balance: {
                XRP: 10,
            }
        },
        {
            username: "Test2",
            password: "1234",
            balance: {
                XRP: 5,
            }
        }
    ];
    constructor(
        private currencyService: CurrencyService
    ) { }

    public async updateCurrencyBalanceByUser(userName: string, currencyName: string, value: number) {

        const targetUser = this.userData.find(user => user.username == userName);
        if (targetUser == null) {
            throw new Error("user not found")
        }

        const currencyData = await this.currencyService.getAllRateCurrency()
        if (currencyData[currencyName] == null) {
            throw new Error("currency not found")
        }

        targetUser.balance[currencyName] ? targetUser.balance[currencyName] += value : targetUser.balance[currencyName] = value;
        return targetUser.balance[currencyName]
    }

    public async transferSameCurrencyToOther(withdrawalUsername: string, depositUsername: string, currencyName: string, value: number) {
        const currencyData = await this.currencyService.getAllRateCurrency()
        if (currencyData[currencyName] == null) {
            throw new Error("currency not found")
        }

        const depositUser = this.userData.find(user => user.username == depositUsername);
        if (depositUser == null) {
            throw new Error("user not found")
        }

        const withdrawalUser = this.userData.find(user => user.username == withdrawalUsername);
        if (withdrawalUser == null) {
            throw new Error("user not found")
        }

        //check balance withdrawal
        if (withdrawalUser.balance[currencyName] < value) {
            throw new Error("balance not enough")
        }

        depositUser.balance[currencyName] ? depositUser.balance[currencyName] += value : depositUser.balance[currencyName] = value;
        withdrawalUser.balance[currencyName] -= value;

        return {
            withdraw: {
                username: withdrawalUser.username,
                currency: currencyName,
                balance: withdrawalUser.balance[currencyName]
            },
            deposit: {
                username: depositUser.username,
                currency: currencyName,
                balance: depositUser.balance[currencyName]
            }
        }
    }

    public async transferOtherCurrencyToOther(withdrawalUsername: string, withdrawalCurrencyName: string, depositUsername: string, depositcurrencyName: string, value: number) {
        const currencyData = await this.currencyService.getAllRateCurrency()
        const withdrawalRateUSD = currencyData[withdrawalCurrencyName];
        const depositRateUSD = currencyData[depositcurrencyName];
        if (withdrawalRateUSD == null || depositRateUSD == null) {
            throw new Error("currency not found")
        }

        const depositUser = this.userData.find(user => user.username == depositUsername);
        if (depositUser == null) {
            throw new Error("user not found")
        }

        const withdrawalUser = this.userData.find(user => user.username == withdrawalUsername);
        if (withdrawalUser == null) {
            throw new Error("user not found")
        }

        //check balance withdrawal
        if (withdrawalUser.balance[withdrawalCurrencyName] < value) {
            throw new Error("balance not enough")
        }

        const amountInUSD = value * withdrawalRateUSD;
        const convertedAmount = amountInUSD / depositRateUSD;

        depositUser.balance[depositcurrencyName] ? depositUser.balance[depositcurrencyName] += convertedAmount : depositUser.balance[depositcurrencyName] = convertedAmount;
        withdrawalUser.balance[withdrawalCurrencyName] -= value;

        return {
            withdraw: {
                username: withdrawalUser.username,
                currency: withdrawalCurrencyName,
                balance: withdrawalUser.balance[withdrawalCurrencyName]
            },
            deposit: {
                username: depositUser.username,
                currency: depositcurrencyName,
                balance: depositUser.balance[depositcurrencyName]
            }
        }
    }
}
