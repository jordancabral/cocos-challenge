import { Instrument } from '../instrument/instrument';

export function foldText(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es');
}

export function searchInstruments(
  instruments: Instrument[],
  query: string,
): Instrument[] {
  const needle = foldText(query.trim());
  if (needle.length === 0) {
    return [];
  }
  const found = new Map<number, Instrument>();
  for (const instrument of instruments) {
    if (instrument.type === 'MONEDA') {
      continue;
    }
    const ticker = foldText(instrument.ticker);
    const name = foldText(instrument.name);
    if (ticker.includes(needle) || name.includes(needle)) {
      found.set(instrument.id, instrument);
    }
  }
  return [...found.values()].sort((left, right) =>
    left.ticker.localeCompare(right.ticker),
  );
}
