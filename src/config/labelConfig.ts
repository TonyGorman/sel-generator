export const MIN_AISLE_VALUE = 0;
export const MAX_AISLE_VALUE = 99;
export const MAX_BAY_VALUE = 99;
export const MAX_SHELF_LETTER = 'L';
export const SHORT_CODE_PREFIXES = ['BAK', 'FOS'] as const;
export const SPECIAL_AISLE_VALUES = ['FLORAL', 'KIOSK', 'SEASONAL'] as const;

// Conservative raster export profile to preserve label edge fidelity.
export const PDF_EXPORT_SCALE = 3;
export const PDF_IMAGE_COMPRESSION = 'NONE' as const;

export const formatTwoDigitValue = (value: number): string => {
	return value.toString().padStart(2, '0');
};

export const normalizePrefix = (values: readonly string[]): string[] => {
	const normalized = values
		.map((value) => value.trim().toUpperCase().replace(/[^A-Z]/g, ''))
		.filter((value) => value.length > 0);

	return Array.from(new Set(normalized));
};

export const normalizeAllowedValue = (value: string, allowedValues: readonly string[]): string | null => {
	const normalized = value.trim().toUpperCase();
	const normalizedAllowedValues = new Set<string>(normalizePrefix(allowedValues));
	if (!normalizedAllowedValues.has(normalized)) {
		return null;
	}

	return normalized;
};

const isAllowedValue = (value: string, allowedValues: readonly string[]): boolean => {
	return normalizeAllowedValue(value, allowedValues) !== null;
};


export const isShortCodePrefix = (value: string): boolean => {
	return isAllowedValue(value, SHORT_CODE_PREFIXES);
};

export const isSpecialAisleValue = (value: string): boolean => {
	return isAllowedValue(value, SPECIAL_AISLE_VALUES);
};

