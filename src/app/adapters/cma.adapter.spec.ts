import { adaptCmaResponse } from './cma.adapter';
import { CmaResponseRaw } from '../models/cma-response-raw.interface';

describe('CmaAdapter', () => {
  it('should transform basic response', () => {
    const raw: CmaResponseRaw = {
      suburb: 'Sydney',
      postcode: '2000',
      median_price: 1000000,
      growth_rate: 0.05,
      property_count: 150
    };

    const result = adaptCmaResponse(raw);

    expect(result.suburb).toBe('Sydney');
    expect(result.postcode).toBe('2000');
    expect(result.medianPrice).toBe(1000000);
    expect(result.growthRate).toBe(0.05);
    expect(result.propertyCount).toBe(150);
    expect(result.comparables).toEqual([]);
    expect(result.chartData).toBeDefined();
  });

  it('should handle missing fields gracefully', () => {
    const raw: CmaResponseRaw = {};

    const result = adaptCmaResponse(raw);

    expect(result.suburb).toBeUndefined();
    expect(result.comparables).toEqual([]);
    expect(result.chartData).toEqual([]);
  });

  it('should extract comparables array', () => {
    const raw: CmaResponseRaw = {
      comparables: [
        { address: '123 Main St', price: 500000, date: '2024-01-01' },
        { address: '456 Oak Ave', price: 600000, date: '2024-02-01' }
      ]
    };

    const result = adaptCmaResponse(raw);

    expect(result.comparables.length).toBe(2);
    expect(result.comparables[0].address).toBe('123 Main St');
    expect(result.comparables[0].price).toBe(500000);
  });

  it('should extract chart data from prices and dates arrays', () => {
    const raw: CmaResponseRaw = {
      prices: [100000, 200000, 300000],
      dates: ['2024-01', '2024-02', '2024-03']
    };

    const result = adaptCmaResponse(raw);

    expect(result.chartData.length).toBe(3);
    expect(result.chartData[0].x).toBe('2024-01');
    expect(result.chartData[0].y).toBe(100000);
  });

  it('should extract chart data from comparables if no price arrays', () => {
    const raw: CmaResponseRaw = {
      comparables: [
        { price: 500000, date: '2024-01-01' },
        { price: 600000, date: '2024-02-01' }
      ]
    };

    const result = adaptCmaResponse(raw);

    expect(result.chartData.length).toBe(2);
    expect(result.chartData[0].y).toBe(500000);
  });

  it('should handle alternative field names', () => {
    const raw: CmaResponseRaw = {
      Suburb: 'Melbourne',
      Postcode: '3000',
      medianPrice: 800000,
      growthRate: 0.03
    };

    const result = adaptCmaResponse(raw);

    expect(result.suburb).toBe('Melbourne');
    expect(result.postcode).toBe('3000');
    expect(result.medianPrice).toBe(800000);
    expect(result.growthRate).toBe(0.03);
  });
});

