export interface BiasMetrics {
  demographicParity: Record<string, number>;
  disparateImpact: Record<string, number>;
  equalizedOdds: Record<string, number>;
  sampleSizes: Record<string, number>;
}

export interface AuditResult {
  metrics: BiasMetrics;
  protectedAttribute: string;
  targetAttribute: string;
  predictionAttribute: string;
  summary?: string;
  recommendations?: string[];
}

export interface DatasetRow {
  [key: string]: any;
}
