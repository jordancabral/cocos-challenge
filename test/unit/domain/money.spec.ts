import { Money } from '../../../src/domain/money/money';

describe('Money', () => {
  it('rejects values that are not decimals', () => {
    expect(() => Money.of('abc')).toThrow('Invalid money');
    expect(() => Money.of('NaN')).toThrow('Invalid money');
  });

  it('keeps centavos exact and serializes two decimals', () => {
    const total = Money.of('10.10')
      .plus(Money.of('0.20'))
      .minus(Money.of('0.05'));
    expect(total.toJson()).toBe('10.25');
    expect(total.timesInt(4).toJson()).toBe('41.00');
  });

  it('rounds half away from zero to two decimals', () => {
    expect(Money.of('1.225').toJson()).toBe('1.23');
    expect(Money.of('-1.225').toJson()).toBe('-1.23');
    expect(Money.of('10.00').returnPercentAgainst(Money.of('8.00'))).toBe(
      '25.00',
    );
    expect(Money.of('-0.446236').toJson()).toBe('-0.45');
  });

  it('omits a return when the cost is not positive', () => {
    expect(Money.of('10.00').returnPercentAgainst(Money.zero())).toBeNull();
  });

  it('buys the greatest whole number of shares inside a peso amount', () => {
    expect(Money.of('100.00').wholeSharesAt(Money.of('30.00'))).toBe(3);
    expect(Money.of('10.00').wholeSharesAt(Money.of('30.00'))).toBe(0);
  });

  it('rejects a non-integer quantity and a non-positive price', () => {
    expect(() => Money.of('1.00').timesInt(1.5)).toThrow(
      'Quantity must be an integer',
    );
    expect(() => Money.of('1.00').wholeSharesAt(Money.zero())).toThrow(
      'Price must be positive',
    );
    expect(() => Money.of('1.00').dividedByInt(0)).toThrow(
      'Divisor must be a non-zero integer',
    );
  });
});
