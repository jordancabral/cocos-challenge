import Decimal from 'decimal.js';

const ROUNDING = Decimal.ROUND_HALF_UP;

export class Money {
  private constructor(private readonly amount: Decimal) {}

  static of(value: string): Money {
    let decimal: Decimal;
    try {
      decimal = new Decimal(value);
    } catch {
      throw new Error('Invalid money');
    }
    if (!decimal.isFinite()) {
      throw new Error('Invalid money');
    }
    return new Money(decimal);
  }

  static zero(): Money {
    return new Money(new Decimal(0));
  }

  plus(other: Money): Money {
    return new Money(this.amount.plus(other.amount));
  }

  minus(other: Money): Money {
    return new Money(this.amount.minus(other.amount));
  }

  timesInt(quantity: number): Money {
    if (!Number.isInteger(quantity)) {
      throw new Error('Quantity must be an integer');
    }
    return new Money(this.amount.times(quantity));
  }

  dividedByInt(quantity: number): Money {
    if (!Number.isInteger(quantity) || quantity === 0) {
      throw new Error('Divisor must be a non-zero integer');
    }
    return new Money(this.amount.div(quantity));
  }

  greaterThan(other: Money): boolean {
    return this.amount.greaterThan(other.amount);
  }

  isPositive(): boolean {
    return this.amount.greaterThan(0);
  }

  isZero(): boolean {
    return this.amount.isZero();
  }

  decimalPlaces(): number {
    return this.amount.decimalPlaces();
  }

  wholeSharesAt(price: Money): number {
    if (!price.isPositive()) {
      throw new Error('Price must be positive');
    }
    return this.amount.div(price.amount).floor().toNumber();
  }

  toJson(): string {
    return this.amount.toDecimalPlaces(2, ROUNDING).toFixed(2);
  }

  returnPercentAgainst(cost: Money): string | null {
    if (!cost.isPositive()) {
      return null;
    }
    const percent = this.amount.minus(cost.amount).div(cost.amount).times(100);
    return percent.toDecimalPlaces(2, ROUNDING).toFixed(2);
  }
}
