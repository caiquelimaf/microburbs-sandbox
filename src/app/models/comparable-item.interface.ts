/**
 * Comparable item structure for table display
 */
export interface ComparableItem {
  [key: string]: any;
  id?: string | number;
  address?: string;
  price?: number;
  date?: string;
  bedrooms?: number;
  bathrooms?: number;
  landSize?: number;
  propertyType?: string;
}

