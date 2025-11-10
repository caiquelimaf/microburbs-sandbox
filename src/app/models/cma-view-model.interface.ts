import { ComparableItem } from './comparable-item.interface';
import { ChartPoint } from './chart-point.interface';

/**
 * Strict normalized view model for rendering
 */
export interface CmaViewModel {
  suburb?: string;
  postcode?: string;
  medianPrice?: number;
  growthRate?: number;
  propertyCount?: number;
  state?: string;
  region?: string;
  comparables: ComparableItem[];
  chartData: ChartPoint[];
  lastUpdated?: Date;
}

