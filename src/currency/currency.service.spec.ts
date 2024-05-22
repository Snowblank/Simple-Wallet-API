import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CurrencyService } from './currency.service';
import { ExchangeRateEntity } from './entity/rateexchange.entity';
import { BadRequestException } from '@nestjs/common';

describe('CurrencyService', () => {
  let service: CurrencyService;

  const mockExchangeRateRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        { provide: getRepositoryToken(ExchangeRateEntity), useValue: mockExchangeRateRepository },
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all currency rates', async () => {
    const rates = [{ name: 'USD', value: 1 }];
    mockExchangeRateRepository.find.mockResolvedValue(rates);

    const result = await service.getAllRateCurrency();
    expect(result).toEqual(rates);
    expect(mockExchangeRateRepository.find).toHaveBeenCalled();
  });

  it('should update the exchange rate', async () => {
    const updateResult = { affected: 1 };
    mockExchangeRateRepository.update.mockResolvedValue(updateResult);

    await service.updateRateExchange('USD', 1.5);

    expect(mockExchangeRateRepository.update).toHaveBeenCalledWith({ name: 'USD' }, { value: 1.5 });
  });

  it('should throw an error if update fails', async () => {
    const updateResult = { affected: 0 };
    mockExchangeRateRepository.update.mockResolvedValue(updateResult);

    await expect(service.updateRateExchange('USD', 1.5)).rejects.toThrow(BadRequestException);
  });

  it('should add a new exchange rate', async () => {
    const newRate = { name: 'EUR', value: 1.2 };
    mockExchangeRateRepository.findOne.mockResolvedValue(null);
    mockExchangeRateRepository.create.mockReturnValue(newRate);
    mockExchangeRateRepository.save.mockResolvedValue(newRate);

    const result = await service.addRateExchange('EUR', 1.2);

    expect(result).toEqual(newRate);
    expect(mockExchangeRateRepository.findOne).toHaveBeenCalledWith({ where: { name: 'EUR' } });
    expect(mockExchangeRateRepository.create).toHaveBeenCalledWith({ name: 'EUR', value: 1.2 });
    expect(mockExchangeRateRepository.save).toHaveBeenCalledWith(newRate);
  });

  it('should throw an error if currency already exists', async () => {
    const existingRate = { name: 'EUR', value: 1.2 };
    mockExchangeRateRepository.findOne.mockResolvedValue(existingRate);

    await expect(service.addRateExchange('EUR', 1.2)).rejects.toThrow(BadRequestException);
  });

  it('should throw an error if amount is invalid', async () => {
    await expect(service.addRateExchange('EUR', -1)).rejects.toThrow(BadRequestException);
  });
});
