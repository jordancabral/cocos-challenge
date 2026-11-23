import { Instrument } from '../../../src/domain/instrument/instrument';
import { searchInstruments } from '../../../src/domain/instrument/search-instruments';

const instruments: Instrument[] = [
  { id: 7, ticker: 'TECO2', name: 'Telecom', type: 'ACCIONES' },
  {
    id: 34,
    ticker: 'GGAL',
    name: 'Grupo Financiero Galicia',
    type: 'ACCIONES',
  },
  {
    id: 13,
    ticker: 'INTR',
    name: 'Compañía Introductora de Buenos Aires S.A.',
    type: 'ACCIONES',
  },
  { id: 66, ticker: 'ARS', name: 'PESOS', type: 'MONEDA' },
];

describe('searchInstruments', () => {
  it('matches a ticker fragment once', () => {
    expect(
      searchInstruments(instruments, 'teco').map((item) => item.ticker),
    ).toEqual(['TECO2']);
  });

  it('matches a name fragment and ignores case and accents', () => {
    expect(
      searchInstruments(instruments, 'galicia').map((item) => item.ticker),
    ).toEqual(['GGAL']);
    expect(
      searchInstruments(instruments, 'compania').map((item) => item.ticker),
    ).toEqual(['INTR']);
  });

  it('excludes the peso instrument and returns an empty list when nothing matches', () => {
    expect(searchInstruments(instruments, 'pesos')).toEqual([]);
    expect(searchInstruments(instruments, 'ARS')).toEqual([]);
    expect(searchInstruments(instruments, 'zzzz')).toEqual([]);
  });

  it('returns nothing for a blank query', () => {
    expect(searchInstruments(instruments, '   ')).toEqual([]);
  });
});
