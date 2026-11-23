export type InstrumentType = 'ACCIONES' | 'MONEDA';

export interface Instrument {
  id: number;
  ticker: string;
  name: string;
  type: InstrumentType;
}
