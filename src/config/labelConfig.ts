export const MAX_AISLE_VALUE = 99;
export const MAX_BAY_VALUE = 99;
export const MAX_SHELF_VALUE = 20;
export const DEFAULT_BACK_CODE_PREFIX = 'BK';

// Conservative raster export profile to preserve label edge fidelity.
export const PDF_EXPORT_SCALE = 3;
export const PDF_IMAGE_COMPRESSION = 'NONE' as const;

export const normalizeBackCodePrefix = (value: string): string => {
	const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2);
	return sanitized.length > 0 ? sanitized : DEFAULT_BACK_CODE_PREFIX;
};

export const formatTwoDigitValue = (value: number): string => {
	return value.toString().padStart(2, '0');
};

export const getShelfTokenForConfig = (index: number, shelfStyle: 'number' | 'alphabetical'): string => {
	if (shelfStyle === 'number') {
		return `${index + 1}`;
	}

	return String.fromCharCode(65 + index);
};