/**
 * Data validation utilities for NFT Catalog
 * Validates CSV data structure and content
 */

export interface NFTRecord {
  'Artwork Title': string;
  'Type': string;
  'Edt Size': string;
  'Mint Date': string;
  'Platform': string;
  'Collection Name': string;
  'Collaborator/Special Type': string;
  'Listed'?: string;
  'Link': string;
  'Contract Hash': string;
  'Token Type': string;
  'TokenID Start': string;
  'Token ID End': string;
  'IPFS Image': string;
  'IPFS Json': string;
  'Pinned?': string;
  'Hosting Type': string;
  'Image link': string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validRecords: number;
  totalRecords: number;
}

/**
 * Required fields that must be present
 */
const REQUIRED_FIELDS = [
  'Artwork Title',
  'Type',
  'Mint Date',
  'Platform',
  'Link'
];

/**
 * Valid NFT types
 */
const VALID_TYPES = ['Unique', 'Edition', 'Generative', 'Series'];

/**
 * Check if a string is a valid Ethereum address
 */
function isValidEthereumAddress(address: string): boolean {
  if (!address) return false;
  // Basic check: starts with 0x and is 42 characters long
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if a string is a valid URL
 */
function isValidURL(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if a string is a valid date
 */
function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate a single NFT record
 */
export function validateNFTRecord(record: any, index: number): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!record[field] || record[field].trim() === '') {
      errors.push(`Row ${index + 2}: Missing required field "${field}"`);
    }
  }

  // Validate Type
  if (record['Type'] && !VALID_TYPES.includes(record['Type'])) {
    warnings.push(`Row ${index + 2}: Unknown type "${record['Type']}" (expected: ${VALID_TYPES.join(', ')})`);
  }

  // Validate Contract Hash (if present)
  if (record['Contract Hash'] && !isValidEthereumAddress(record['Contract Hash'])) {
    warnings.push(`Row ${index + 2}: Invalid Ethereum address format for Contract Hash`);
  }

  // Validate URLs
  if (record['Link'] && !isValidURL(record['Link'])) {
    warnings.push(`Row ${index + 2}: Invalid URL format for Link`);
  }

  if (record['Image link'] && record['Image link'].trim() !== '' && !isValidURL(record['Image link'])) {
    warnings.push(`Row ${index + 2}: Invalid URL format for Image link`);
  }

  // Validate Mint Date
  if (record['Mint Date'] && !isValidDate(record['Mint Date'])) {
    warnings.push(`Row ${index + 2}: Invalid date format for Mint Date: "${record['Mint Date']}"`);
  }

  // Validate Edition Size (should be numeric if present)
  if (record['Edt Size'] && record['Edt Size'].trim() !== '') {
    const editionSize = parseInt(record['Edt Size']);
    if (isNaN(editionSize) || editionSize < 1) {
      warnings.push(`Row ${index + 2}: Invalid Edition Size: "${record['Edt Size']}" (should be a positive number)`);
    }
  }

  // Validate Token IDs (should be numeric if present)
  if (record['TokenID Start'] && record['TokenID Start'].trim() !== '') {
    // Token IDs can be very large, so we just check if it's numeric-ish
    if (!/^\d+$/.test(record['TokenID Start'].replace(/[,_]/g, ''))) {
      warnings.push(`Row ${index + 2}: Invalid Token ID Start format: "${record['TokenID Start']}"`);
    }
  }

  // Check for IPFS data
  if (!record['IPFS Image'] && !record['Image link']) {
    warnings.push(`Row ${index + 2}: No image source (neither IPFS Image nor Image link provided)`);
  }

  // Validate IPFS hashes (basic check)
  if (record['IPFS Image'] && record['IPFS Image'].trim() !== '') {
    const ipfsHash = record['IPFS Image'].replace('ipfs://', '');
    if (ipfsHash.length < 10) {
      warnings.push(`Row ${index + 2}: Suspicious IPFS Image hash (too short): "${record['IPFS Image']}"`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate entire dataset
 */
export function validateNFTData(data: any[]): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    validRecords: 0,
    totalRecords: data.length
  };

  // Check if data is empty
  if (!data || data.length === 0) {
    result.isValid = false;
    result.errors.push('No data found in CSV file');
    return result;
  }

  // Validate each record
  data.forEach((record, index) => {
    // Skip empty rows
    if (!record['Artwork Title'] && !record['Link']) {
      return;
    }

    const validation = validateNFTRecord(record, index);

    if (validation.isValid) {
      result.validRecords++;
    } else {
      result.isValid = false;
    }

    result.errors.push(...validation.errors);
    result.warnings.push(...validation.warnings);
  });

  return result;
}

/**
 * Sanitize NFT data by removing invalid records
 */
export function sanitizeNFTData(data: any[]): any[] {
  return data.filter((record, index) => {
    // Remove completely empty rows
    if (!record['Artwork Title'] && !record['Link']) {
      return false;
    }

    // Validate and only keep records with no critical errors
    const validation = validateNFTRecord(record, index);
    return validation.isValid;
  });
}

/**
 * Get validation summary message
 */
export function getValidationSummary(result: ValidationResult): string {
  const parts: string[] = [];

  parts.push(`Total records: ${result.totalRecords}`);
  parts.push(`Valid records: ${result.validRecords}`);

  if (result.errors.length > 0) {
    parts.push(`Errors: ${result.errors.length}`);
  }

  if (result.warnings.length > 0) {
    parts.push(`Warnings: ${result.warnings.length}`);
  }

  return parts.join(' | ');
}

/**
 * Log validation results to console
 */
export function logValidationResults(result: ValidationResult): void {
  console.group('📊 NFT Data Validation Results');
  console.log(getValidationSummary(result));

  if (result.errors.length > 0) {
    console.group('❌ Errors');
    result.errors.forEach(error => console.error(error));
    console.groupEnd();
  }

  if (result.warnings.length > 0) {
    console.group('⚠️ Warnings');
    result.warnings.forEach(warning => console.warn(warning));
    console.groupEnd();
  }

  console.groupEnd();
}
