export type Section = {
  type: 'text' | 'data';
  locationCounter: number;
  entries: Array<any>;
  symbols: Set<string>
  literalPool: Array<{ location: number, name: string, symbolName: string }>
}