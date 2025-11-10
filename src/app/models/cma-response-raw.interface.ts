/**
 * Loose interface for raw API response
 * Uses any for unknown fields to handle variable API structure
 */
export interface CmaResponseRaw {
  [key: string]: any;
  suburb?: string | null;
  postcode?: string | number | null;
  median_price?: number | null;
  medianPrice?: number | null;
  growth_rate?: number | null;
  growthRate?: number | null;
  property_count?: number | null;
  propertyCount?: number | null;
  state?: string | null;
  region?: string | null;
  comparables?: any[] | null;
  sales?: any[] | null;
  prices?: number[] | null;
  dates?: string[] | number[] | null;
}

