import { CmaResponseRaw } from '../models/cma-response-raw.interface';
import { CmaViewModel } from '../models/cma-view-model.interface';
import { ComparableItem } from '../models/comparable-item.interface';
import { ChartPoint } from '../models/chart-point.interface';

/**
 * Pure adapter functions to transform raw API response to normalized view models
 */

/**
 * Extract suburb name from response
 */
function extractSuburb(data: CmaResponseRaw): string | undefined {
  // Check property object first
  const property = data['property'];
  if (property && typeof property === 'object') {
    const prop = property as any;
    if (prop.suburb || prop['Suburb'] || prop.suburbName || prop.sal || prop['sal']) {
      return prop.suburb || prop['Suburb'] || prop.suburbName || prop.sal || prop['sal'];
    }
  }
  return data.suburb || data['Suburb'] || data['suburbName'] || data['sal'];
}

/**
 * Extract postcode from response
 */
function extractPostcode(data: CmaResponseRaw): string | undefined {
  const postcode = data.postcode || data['postCode'] || data['Postcode'];
  return postcode ? String(postcode) : undefined;
}

/**
 * Extract median price from response
 */
function extractMedianPrice(data: CmaResponseRaw): number | undefined {
  // Check property object first
  const property = data['property'];
  if (property && typeof property === 'object') {
    const prop = property as any;
    if (prop.price || prop['price']) {
      const price = prop.price || prop['price'];
      // Handle formatted strings like "$1,010,000"
      if (typeof price === 'string') {
        const numPrice = Number(price.replace(/[$,]/g, ''));
        if (!isNaN(numPrice)) return numPrice;
      }
      return typeof price === 'number' ? price : undefined;
    }
  }
  return data.median_price || data.medianPrice || data['median'];
}

/**
 * Extract growth rate from response
 */
function extractGrowthRate(data: CmaResponseRaw): number | undefined {
  // Check property object first
  const property = data['property'];
  if (property && typeof property === 'object') {
    const prop = property as any;
    if (prop.growth_rate || prop['growth_rate'] || prop.growthRate || prop['growthRate']) {
      return prop.growth_rate || prop['growth_rate'] || prop.growthRate || prop['growthRate'];
    }
  }
  return data.growth_rate || data.growthRate || data['growth'];
}

/**
 * Extract property count from response
 */
function extractPropertyCount(data: CmaResponseRaw): number | undefined {
  return data.property_count || data.propertyCount || data['properties'];
}

/**
 * Extract state from response
 */
function extractState(data: CmaResponseRaw): string | undefined {
  return data.state || data['State'];
}

/**
 * Extract region from response
 */
function extractRegion(data: CmaResponseRaw): string | undefined {
  return data.region || data['Region'];
}

/**
 * Extract comparables array from response
 */
function extractComparables(data: CmaResponseRaw): ComparableItem[] {
  // Try different possible locations for comparables
  const comparables = 
    data.comparables || 
    data['comparableSales'] || 
    data.sales || 
    data['comparablesList'] ||
    data['similar_properties'] ||
    data['similarProperties'] ||
    [];
  
  if (!Array.isArray(comparables)) {
    return [];
  }

  return comparables.map((item: any) => ({
    id: item.id || item.Id || item.propertyId || item.gnaf_pid || item['gnaf_pid'],
    address: item.address || item.Address || item.propertyAddress || item.street || item['street'],
    price: item.price || item.Price || item.salePrice || item.value || item['price'],
    date: item.date || item.Date || item.saleDate || item.transactionDate || item['formatted_date'],
    bedrooms: item.bedrooms || item.Bedrooms || item.beds,
    bathrooms: item.bathrooms || item.Bathrooms || item.baths,
    landSize: item.landSize || item.LandSize || item.landArea || item.area || item['land_size'],
    propertyType: item.propertyType || item.PropertyType || item.type || item['property_type'],
    ...item // Include any additional fields
  })).filter((item: ComparableItem) => item !== null && item !== undefined);
}

/**
 * Extract chart data points from response
 */
function extractChartData(data: CmaResponseRaw): ChartPoint[] {
  const points: ChartPoint[] = [];

  // Try to find price arrays with dates
  const prices = data.prices || data['Prices'] || data['priceHistory'] || [];
  const dates = data.dates || data['Dates'] || data['dateHistory'] || [];

  if (Array.isArray(prices) && Array.isArray(dates) && prices.length === dates.length && prices.length > 0) {
    return prices.map((price: number, index: number) => ({
      x: dates[index],
      y: price,
      label: String(dates[index])
    }));
  }

  // Try to find comparables with prices and dates (including similar_properties)
  const comparables = extractComparables(data);
  
  if (comparables.length > 0) {
    const chartPoints: ChartPoint[] = [];
    
    for (const item of comparables) {
      // Check if price exists and is a valid number
      const rawPrice: any = item.price;
      if (rawPrice === null || rawPrice === undefined) {
        continue;
      }
      
      let priceValue: number;
      if (typeof rawPrice === 'string') {
        // Remove $ and commas, then parse
        const cleanedPrice: string = rawPrice.replace(/[$,]/g, '');
        priceValue = Number(cleanedPrice);
      } else if (typeof rawPrice === 'number') {
        priceValue = rawPrice;
      } else {
        // Convert to string first, then parse
        const priceStr: string = String(rawPrice);
        priceValue = Number(priceStr.replace(/[$,]/g, ''));
      }
      
      if (isNaN(priceValue)) {
        continue;
      }
      
      // Extract date - use formatted_date if available (use bracket notation for index signature)
      const dateValue = item.date || (item as any)['formatted_date'] || 'Unknown';
      const address = item.address || String(dateValue);
      
      chartPoints.push({
        x: String(dateValue),
        y: priceValue,
        label: address
      });
    }
    
    // Sort by date if possible
    chartPoints.sort((a, b) => {
      const dateA = new Date(a.x).getTime();
      const dateB = new Date(b.x).getTime();
      if (!isNaN(dateA) && !isNaN(dateB)) {
        return dateA - dateB;
      }
      return 0;
    });
    
    // Limit to 20 points for chart readability
    return chartPoints.slice(0, 20);
  }

  // Try to find numeric fields that could be charted
  const numericFields = Object.entries(data)
    .filter(([key, value]) => typeof value === 'number' && !isNaN(value))
    .slice(0, 10); // Limit to 10 fields

  if (numericFields.length > 0) {
    return numericFields.map(([key, value]) => ({
      x: key,
      y: value as number,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));
  }

  return points;
}

/**
 * Transform raw API response to normalized view model
 */
export function adaptCmaResponse(raw: CmaResponseRaw): CmaViewModel {
  return {
    suburb: extractSuburb(raw),
    postcode: extractPostcode(raw),
    medianPrice: extractMedianPrice(raw),
    growthRate: extractGrowthRate(raw),
    propertyCount: extractPropertyCount(raw),
    state: extractState(raw),
    region: extractRegion(raw),
    comparables: extractComparables(raw),
    chartData: extractChartData(raw),
    lastUpdated: new Date()
  };
}

