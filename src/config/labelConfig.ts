export const MIN_AISLE_VALUE = 0;
export const MAX_AISLE_VALUE = 99;
export const MAX_BAY_VALUE = 99;
export const MAX_SHELF_LETTER = 'L';
export const DEFAULT_BACK_CODE_PREFIX = 'BACK';
export const SPECIAL_AISLE_VALUES = ['KIOSK', 'FLORAL', 'SEASONAL'] as const;
const BACK_CODE_PREFIX_MAX_LENGTH = DEFAULT_BACK_CODE_PREFIX.length;

// Conservative raster export profile to preserve label edge fidelity.
export const PDF_EXPORT_SCALE = 3;
export const PDF_IMAGE_COMPRESSION = 'NONE' as const;

export const normalizeBackCodePrefix = (value: string): string => {
	const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, BACK_CODE_PREFIX_MAX_LENGTH);
	return sanitized.length > 0 ? sanitized : DEFAULT_BACK_CODE_PREFIX;
};

export const formatTwoDigitValue = (value: number): string => {
	return value.toString().padStart(2, '0');
};

export const normalizeSpecialAisleValues = (values: readonly string[]): string[] => {
	const normalized = values
		.map((value) => value.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8))
		.filter((value) => value.length > 0);

	return Array.from(new Set(normalized));
};

export const normalizeSpecialAisleValue = (value: string, allowedValues: readonly string[] = SPECIAL_AISLE_VALUES): string | null => {
	const normalized = value.trim().toUpperCase();
	const specialAisleValueSet = new Set<string>(normalizeSpecialAisleValues(allowedValues));
	if (!specialAisleValueSet.has(normalized)) {
		return null;
	}

	return normalized;
};

export const isSpecialAisleValue = (value: string, allowedValues: readonly string[] = SPECIAL_AISLE_VALUES): boolean => {
	return normalizeSpecialAisleValue(value, allowedValues) !== null;
};