// Value thresholds
const VALUE_THRESHOLDS = {
  Qn: 1e18,  // Quintillion (1,000,000,000,000,000,000)
  Qd: 1e15,  // Quadrillion (1,000,000,000,000,000)
  T: 1e12,   // Trillion (1,000,000,000,000)
  B: 1e9,    // Billion (1,000,000,000)
  M: 1e6,    // Million (1,000,000)
  K: 1e3,    // Thousand (1,000)
};

export function formatValue(value: string | number): string {
  if (value === 'inf' || value === Infinity) return '∞';
  
  const numValue = typeof value === 'string' ? 
    parseFloat(value.replace(/[KMBTQdQn]/g, '')) : value;

  if (isNaN(numValue)) return '0';

  if (numValue >= VALUE_THRESHOLDS.Qn) return `${(numValue / VALUE_THRESHOLDS.Qn).toFixed(1)}Qn`;
  if (numValue >= VALUE_THRESHOLDS.Qd) return `${(numValue / VALUE_THRESHOLDS.Qd).toFixed(1)}Qd`;
  if (numValue >= VALUE_THRESHOLDS.T) return `${(numValue / VALUE_THRESHOLDS.T).toFixed(1)}T`;
  if (numValue >= VALUE_THRESHOLDS.B) return `${(numValue / VALUE_THRESHOLDS.B).toFixed(1)}B`;
  if (numValue >= VALUE_THRESHOLDS.M) return `${(numValue / VALUE_THRESHOLDS.M).toFixed(1)}M`;
  if (numValue >= VALUE_THRESHOLDS.K) return `${(numValue / VALUE_THRESHOLDS.K).toFixed(1)}K`;

  return numValue.toString();
}

export function parseValue(value: string): number {
  if (value === '∞' || value === 'inf') return Infinity;
  
  const multipliers: { [key: string]: number } = {
    K: 1e3,     // Thousand
    M: 1e6,     // Million
    B: 1e9,     // Billion
    T: 1e12,    // Trillion
    Qd: 1e15,   // Quadrillion
    Qn: 1e18,   // Quintillion
  };

  const match = value.match(/^(\d+\.?\d*)\s*([KMBTQdQn])?$/);
  if (!match) return 0;

  const [, num, unit] = match;
  const baseValue = parseFloat(num);
  return unit ? baseValue * multipliers[unit] : baseValue;
}