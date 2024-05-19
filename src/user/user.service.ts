import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CurrencyService } from 'src/currency/currency.service';
import { UserEntity } from './entity/user.entity';
import { Repository } from 'typeorm';
import { WalletEntity } from 'src/currency/entity/wallet.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface IUser {
    username: string;
    password: string;
    account_type: ETypeAccount
    balance: { [currencyName: string]: number }
}

export enum ETypeAccount {
    USER,
    ADMIN
}

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,

        @InjectRepository(WalletEntity)
        private walletRepository: Repository<WalletEntity>,

        private currencyService: CurrencyService,

        private jwtService: JwtService,

        private cfgService: ConfigService,
    ) { }

    public async createUser(username: string, password: string, role: ETypeAccount) {

        const userRepository = this.userRepository.create({ name: username, password, account_type: role })

        const result = await this.userRepository.save(userRepository);
        return result;
    }

    public async loginUser(username: string, password: string) {
        const userRepository = await this.userRepository.findOne({ where: { name: username } });
        if (userRepository == null) {
            throw new Error("user not found")
        }

        //compare password
        if (userRepository.password != password) {
            throw new Error('password is wrong')
        }

        //create token and for use func
        const payload = { role: userRepository.account_type, name: userRepository.name };
        const secret = this.cfgService.get("SECRET_JWT");
        const token = await this.jwtService.signAsync(payload, { secret: secret, expiresIn: '5m' });
        return token;
    }

    public async updateCurrencyBalanceByUser(userName: string, currencyName: string, value: number) {
        const currencyData = await this.currencyService.getAllRateCurrency()
        if (!currencyData.some(currencyData => currencyData.name == currencyName)) {
            throw new Error("currency not found")
        }

        const userRepository = await this.userRepository.findOne({
            relations: ['wallets'],
            where: { name: userName }
        })
        if (userRepository == null) {
            throw new Error("user not found")
        }

        const increaseResult = await this.walletRepository.increment({
            currency: currencyName,
            user: userRepository
        },
            'value',
            value
        )
        if (increaseResult.affected < 1) {
            const walletData = this.walletRepository.create({ currency: currencyName, value: value, user: userRepository });
            await this.walletRepository.save(walletData);
        }

        const result = await this.walletRepository.findOne({
            relations: ['user'],
            where:
            {
                currency: currencyName,
                user: { id: userRepository.id }
            }
        });

        return result.value;
    }

    public async transferSameCurrencyToOther(withdrawalUsername: string, depositUsername: string, currencyName: string, value: number) {
        const currencyData = await this.currencyService.getAllRateCurrency()
        if (!currencyData.some(currencyData => currencyData.name == currencyName)) {
            throw new Error("currency not found")
        }

        const depositUserRepository = await this.userRepository.findOne({
            relations: ['wallets'],
            where: { name: depositUsername }
        })
        if (depositUserRepository == null) {
            throw new Error("user not found")
        }

        const withdrawalUserRepository = await this.userRepository.findOne({
            relations: ['wallets'],
            where: { name: withdrawalUsername }
        })
        if (withdrawalUserRepository == null) {
            throw new Error("user not found")
        }

        //check balance withdrawal
        const targetCurrency = withdrawalUserRepository.wallets.find((walletRp) => walletRp.currency === currencyName);
        if (!targetCurrency || targetCurrency.value < value) {
            throw new Error("balance not enough")
        }

        const increasewithdrawalResult = await this.walletRepository.increment({
            currency: currencyName,
            user: withdrawalUserRepository
        },
            'value',
            -value
        )

        const increaseDepositResult = await this.walletRepository.increment({
            currency: currencyName,
            user: depositUserRepository
        },
            'value',
            value
        )
        if (increaseDepositResult.affected < 1) {
            const walletData = this.walletRepository.create({ currency: currencyName, value: value, user: depositUserRepository });
            await this.walletRepository.save(walletData);
        }

        const depositUser = await this.userRepository.findOne({ where: { name: depositUsername } });
        const withdrawalUser = await this.userRepository.findOne({ where: { name: withdrawalUsername } });

        const withdrawUserBalance = withdrawalUser.wallets.find((walletData) => walletData.currency == currencyName);
        const depositUserBalance = depositUser.wallets.find((walletData) => walletData.currency == currencyName);

        return {
            withdraw: {
                username: withdrawalUser.name,
                currency: currencyName,
                balance: withdrawUserBalance.value
            },
            deposit: {
                username: depositUser.name,
                currency: currencyName,
                balance: depositUserBalance.value
            }
        }
    }

    public async transferOtherCurrencyToOther(withdrawalUsername: string, withdrawalCurrencyName: string, depositUsername: string, depositcurrencyName: string, value: number) {
        // const currencyData = await this.currencyService.getAllRateCurrency()
        // const withdrawalRateUSD = currencyData[withdrawalCurrencyName];
        // const depositRateUSD = currencyData[depositcurrencyName];
        // if (withdrawalRateUSD == null || depositRateUSD == null) {
        //     throw new Error("currency not found")
        // }

        // const depositUser = this.userData.find(user => user.username == depositUsername);
        // if (depositUser == null) {
        //     throw new Error("user not found")
        // }

        // const withdrawalUser = this.userData.find(user => user.username == withdrawalUsername);
        // if (withdrawalUser == null) {
        //     throw new Error("user not found")
        // }

        // //check balance withdrawal
        // if (withdrawalUser.balance[withdrawalCurrencyName] < value) {
        //     throw new Error("balance not enough")
        // }

        // const amountInUSD = value * withdrawalRateUSD;
        // const convertedAmount = amountInUSD / depositRateUSD;

        // depositUser.balance[depositcurrencyName] ? depositUser.balance[depositcurrencyName] += convertedAmount : depositUser.balance[depositcurrencyName] = convertedAmount;
        // withdrawalUser.balance[withdrawalCurrencyName] -= value;

        // return {
        //     withdraw: {
        //         username: withdrawalUser.username,
        //         currency: withdrawalCurrencyName,
        //         balance: withdrawalUser.balance[withdrawalCurrencyName]
        //     },
        //     deposit: {
        //         username: depositUser.username,
        //         currency: depositcurrencyName,
        //         balance: depositUser.balance[depositcurrencyName]
        //     }
        // }
    }
}
