import { Test, TestingModule } from '@nestjs/testing';
import { ETypeAccount, UserService } from './user.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserEntity } from './entity/user.entity';
import { WalletEntity } from '../currency/entity/wallet.entity';
import { CurrencyService } from '../currency/currency.service';

describe('UserService', () => {
  let service: UserService;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockWalletRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockCurrencyService = {
    getAllRateCurrency: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepository },
        { provide: getRepositoryToken(WalletEntity), useValue: mockWalletRepository },
        { provide: CurrencyService, useValue: mockCurrencyService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new user', async () => {
    const userDto = { name: 'test', password: 'test', account_type: ETypeAccount.USER };
    const createdUser = { id: '1', ...userDto };

    mockUserRepository.create.mockReturnValue(createdUser);
    mockUserRepository.save.mockResolvedValue(createdUser);

    const result = await service.createUser(userDto.name, userDto.password, userDto.account_type);

    expect(result).toEqual(createdUser);
    expect(mockUserRepository.create).toHaveBeenCalledWith(userDto);
    expect(mockUserRepository.save).toHaveBeenCalledWith(createdUser);
  });

  it('should return a JWT token for valid user credentials', async () => {
    const user = { id: '1', name: 'test', password: 'test', account_type: ETypeAccount.USER };
    const secret = 'secret';
    const token = 'jwt-token';

    mockUserRepository.findOne.mockResolvedValue(user);
    mockConfigService.get.mockReturnValue(secret);
    mockJwtService.signAsync.mockResolvedValue(token);

    const result = await service.loginUser(user.name, user.password);

    expect(result).toEqual(token);
    expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { name: user.name } });
    expect(mockJwtService.signAsync).toHaveBeenCalledWith({ role: user.account_type, name: user.name }, { secret, expiresIn: '5m' });
  });

  it('should return total balance for all currencies', async () => {
    const currencies = [{ name: 'USD', value: 1 }];
    const wallets = [{ currency: 'USD', value: '100.00' }];

    mockCurrencyService.getAllRateCurrency.mockResolvedValue(currencies);
    mockWalletRepository.find.mockResolvedValue(wallets);

    const result = await service.getAllTotalBalance();

    expect(result).toEqual([{ currency: 'USD', amount: 100 }]);
    expect(mockCurrencyService.getAllRateCurrency).toHaveBeenCalled();
    expect(mockWalletRepository.find).toHaveBeenCalled();
  });

  it('should update currency balance for a user', async () => {
    const user = { id: '1', name: 'test', wallets: [{ currency: 'USD', value: '100.00' }] };
    const updatedValue = (100 + 50).toFixed(8); // 150.00000000

    mockCurrencyService.getAllRateCurrency.mockResolvedValue([{ name: 'USD' }]);
    const queryRunner = mockDataSource.createQueryRunner();

    queryRunner.manager.findOne
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce({
        userId: user.id,
        currency: 'USD', value: updatedValue,
      });

    queryRunner.manager.update.mockResolvedValue({ affected: 1 });

    const result = await service.updateCurrencyBalanceByUser(user.name, 'USD', 50);

    expect(result).toEqual(parseFloat(updatedValue));
    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.manager.findOne).toHaveBeenCalledWith(UserEntity, {
      relations: ['wallets'],
      where: { name: user.name },
    });
    expect(queryRunner.manager.update).toHaveBeenCalledWith(
      WalletEntity,
      { currency: 'USD', user },
      { value: updatedValue },
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });
});
