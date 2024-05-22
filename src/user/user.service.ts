import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CurrencyService } from 'src/currency/currency.service';
import { UserEntity } from './entity/user.entity';
import { DataSource, Repository } from 'typeorm';
import { WalletEntity } from 'src/currency/entity/wallet.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ExchangeRateEntity } from 'src/currency/entity/rateexchange.entity';

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

        private dataSource: DataSource,
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

    public async getAllTotalBalance() {
        const currencyData: ExchangeRateEntity[] = await this.currencyService.getAllRateCurrency();

        const allWalletData: WalletEntity[] = await this.walletRepository.find();

        const result = [];
        for (let i = 0; i < currencyData.length; i++) {
            const currencyName = currencyData[i].name;
            const allTargetWallet = allWalletData.filter((walletData) => walletData.currency == currencyName);

            let amount = 0;
            allTargetWallet.forEach(targetWallet => {
                amount += parseFloat(targetWallet.value);
            });
            const data = {
                currency: currencyName,
                amount
            }
            result.push(data);
        }
        return result;
    }

    public async updateCurrencyBalanceByUser(userName: string, currencyName: string, value: number) {
        const queryRunner = this.dataSource.createQueryRunner();
        queryRunner.connect();
        queryRunner.startTransaction()

        try {
            const currencyData = await this.currencyService.getAllRateCurrency()
            if (!currencyData.some(currencyData => currencyData.name == currencyName)) {
                throw new NotFoundException("currency not found")
            }

            const userRepository = await queryRunner.manager.findOne(UserEntity, {
                relations: ['wallets'],
                where: { name: userName }
            })
            if (userRepository == null) {
                throw new NotFoundException("user not found")
            }

            const targetWallet = userRepository.wallets.find((currencyData) => currencyData.currency == currencyName);
            if (targetWallet) {
                const currValue = parseFloat(targetWallet.value);
                const newValue = (currValue + value).toFixed(8);
                await queryRunner.manager.update(WalletEntity,
                    {
                        currency: currencyName,
                        user: userRepository
                    },
                    {
                        value: newValue
                    }
                )
            } else {
                const newValue = value.toFixed(8);
                const walletData = queryRunner.manager.create(WalletEntity, { currency: currencyName, value: newValue, user: userRepository });
                await queryRunner.manager.save(walletData);
            }

            const result = await queryRunner.manager.findOne(WalletEntity, {
                relations: ['user'],
                where:
                {
                    currency: currencyName,
                    user: { id: userRepository.id }
                }
            });
            await queryRunner.commitTransaction();
            return parseFloat(result.value);
        } catch (e) {
            await queryRunner.rollbackTransaction();
        } finally {
            await queryRunner.release();
        }
    }

    public async transferSameCurrencyToOther(withdrawalUsername: string, depositUsername: string, currencyName: string, value: number) {
        const queryRunner = this.dataSource.createQueryRunner();
        queryRunner.connect();
        queryRunner.startTransaction()

        try {
            console.log("transferSameCurrencyToOther")
            const currencyData = await this.currencyService.getAllRateCurrency()
            if (!currencyData.some(currencyData => currencyData.name == currencyName)) {
                throw new NotFoundException("currency not found")
            }
            console.log("currencyData",currencyData)
            const depositUserRepository = await queryRunner.manager.findOne(UserEntity, {
                relations: ['wallets'],
                where: { name: depositUsername }
            })
            if (depositUserRepository == null) {
                throw new NotFoundException("user not found")
            }

            const withdrawalUserRepository = await queryRunner.manager.findOne(UserEntity, {
                relations: ['wallets'],
                where: { name: withdrawalUsername }
            })
            if (withdrawalUserRepository == null) {
                throw new NotFoundException("user not found")
            }

            //check balance withdrawal
            const targetCurrency = withdrawalUserRepository.wallets.find((walletRp) => walletRp.currency === currencyName);
            const currValue = parseFloat(targetCurrency.value);
            if (!targetCurrency || currValue < value) {
                throw new BadRequestException("balance not enough")
            }

            const newValue = (currValue - value).toFixed(8);
            const increasewithdrawalResult = await queryRunner.manager.update(WalletEntity, {
                currency: currencyName,
                user: withdrawalUserRepository
            },
                {
                    value: newValue
                }
            )

            const depositWallet = depositUserRepository.wallets.find((currencyData) => currencyData.currency == currencyName);
            if (depositWallet) {
                const currValue = parseFloat(depositWallet.value);
                const newValue = (currValue + value).toFixed(8);
                const increaseDepositResult = await queryRunner.manager.update(WalletEntity, {
                    currency: currencyName,
                    user: depositUserRepository
                },
                    {
                        value: newValue
                    }
                )
            } else {
                const newValue = value.toFixed(8);
                const walletData = queryRunner.manager.create(WalletEntity, { currency: currencyName, value: newValue, user: depositUserRepository });
                await queryRunner.manager.save(walletData);
            }

            const depositUser = await queryRunner.manager.findOne(UserEntity, { where: { name: depositUsername } });
            const withdrawalUser = await queryRunner.manager.findOne(UserEntity, { where: { name: withdrawalUsername } });

            const withdrawUserBalance = withdrawalUser.wallets.find((walletData) => walletData.currency == currencyName);
            const depositUserBalance = depositUser.wallets.find((walletData) => walletData.currency == currencyName);

            await queryRunner.commitTransaction();
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
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        } finally {
            await queryRunner.release();
        }
    }

    public async transferOtherCurrencyToOther(withdrawalUsername: string, withdrawalCurrencyName: string, depositUsername: string, depositcurrencyName: string, value: number) {
        const queryRunner = this.dataSource.createQueryRunner();
        queryRunner.connect();
        queryRunner.startTransaction()
        try {
            const currencyData = await this.currencyService.getAllRateCurrency()
            const withdrawalRateUSD = currencyData.find((currencyData => currencyData.name == withdrawalCurrencyName))?.value;
            const depositRateUSD = currencyData.find((currencyData => currencyData.name == depositcurrencyName))?.value;
            if (!withdrawalRateUSD || !depositRateUSD) {
                throw new NotFoundException("currency not found")
            }

            const depositUserRepository = await queryRunner.manager.findOne(UserEntity, {
                relations: ['wallets'],
                where: { name: depositUsername }
            })
            if (depositUserRepository == null) {
                throw new NotFoundException("user not found")
            }

            const withdrawalUserRepository = await queryRunner.manager.findOne(UserEntity, {
                relations: ['wallets'],
                where: { name: withdrawalUsername }
            })
            if (withdrawalUserRepository == null) {
                throw new NotFoundException("user not found")
            }

            //check balance withdrawal
            const withdrawalCurrency = withdrawalUserRepository.wallets.find((walletRp) => walletRp.currency === withdrawalCurrencyName);
            const currValue = parseFloat(withdrawalCurrency.value);

            if (!withdrawalCurrency || currValue < value) {
                throw new BadRequestException("balance not enough")
            }

            //convert
            const amountInUSD = value * withdrawalRateUSD;
            const convertedAmount = amountInUSD / depositRateUSD;

            const newValue = (currValue - value).toFixed(8);
            const increasewithdrawalResult = await queryRunner.manager.update(WalletEntity, {
                currency: withdrawalCurrencyName,
                user: withdrawalUserRepository
            },
                {
                    value: newValue
                }
            )

            const depositWallet = depositUserRepository.wallets.find((currencyData) => currencyData.currency == depositcurrencyName);
            if (depositWallet) {
                const currValue = parseFloat(depositWallet.value);
                const newValue = (currValue + convertedAmount).toFixed(8);

                const increaseDepositResult = await queryRunner.manager.update(WalletEntity, {
                    currency: depositcurrencyName,
                    user: depositUserRepository
                },
                    {
                        value: newValue
                    }
                )
            } else {
                const newValue = convertedAmount.toFixed(8);
                const walletData = queryRunner.manager.create(WalletEntity, { currency: depositcurrencyName, value: newValue, user: depositUserRepository });
                await queryRunner.manager.save(walletData);
            }

            const depositUser = await queryRunner.manager.findOne(UserEntity, { where: { name: depositUsername } });
            const withdrawalUser = await queryRunner.manager.findOne(UserEntity, { where: { name: withdrawalUsername } });

            const withdrawUserBalance = withdrawalUser.wallets.find((walletData) => walletData.currency == withdrawalCurrencyName);
            const depositUserBalance = depositUser.wallets.find((walletData) => walletData.currency == depositcurrencyName);

            await queryRunner.commitTransaction();

            return {
                withdraw: {
                    username: withdrawalUser.name,
                    currency: withdrawalCurrencyName,
                    balance: withdrawUserBalance.value
                },
                deposit: {
                    username: depositUser.name,
                    currency: depositcurrencyName,
                    balance: depositUserBalance.value
                }
            }

        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        } finally {
            await queryRunner.release();
        }
    }
}
