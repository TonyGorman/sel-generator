export const LABEL_CONSTRAINTS = {
	aisle: {
		min: 0,
		max: 99,
		prefixes: ['BR', 'BL', 'FL', 'FR'] as const,
		specialValues: ['FLORAL', 'KIOSK', 'SEASONAL'] as const,
	},
	bay: {
		min: 1,
		max: 99,
	},
	shelf: {
		min: 'A',
		max: 'Z',
	},
	shortCode: {
		prefixes: ['BAK', 'FOS', 'FNT'] as const,
	},
	pdfExport: {
		// Conservative raster export profile to preserve label edge fidelity.
		scale: 3,
		imageCompression: 'NONE' as const,
	},
	labelGeneration: {
		softLimit: 500,
		hardLimit: 1000,
	},
} as const;

export const MIN_AISLE_VALUE = LABEL_CONSTRAINTS.aisle.min;
export const MAX_AISLE_VALUE = LABEL_CONSTRAINTS.aisle.max;
export const MIN_BAY_VALUE = LABEL_CONSTRAINTS.bay.min;
export const MAX_BAY_VALUE = LABEL_CONSTRAINTS.bay.max;
export const MIN_SHELF_LETTER = LABEL_CONSTRAINTS.shelf.min;
export const MAX_SHELF_LETTER = LABEL_CONSTRAINTS.shelf.max;
export const AISLE_PREFIXES = LABEL_CONSTRAINTS.aisle.prefixes;
export const SHORT_CODE_PREFIXES = LABEL_CONSTRAINTS.shortCode.prefixes;
export const SPECIAL_AISLE_VALUES = LABEL_CONSTRAINTS.aisle.specialValues;

export const PDF_EXPORT_SCALE = LABEL_CONSTRAINTS.pdfExport.scale;
export const PDF_IMAGE_COMPRESSION = LABEL_CONSTRAINTS.pdfExport.imageCompression;
export const LABEL_SOFT_LIMIT = LABEL_CONSTRAINTS.labelGeneration.softLimit;
export const LABEL_HARD_LIMIT = LABEL_CONSTRAINTS.labelGeneration.hardLimit;

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

export const isAislePrefix = (value: string): boolean => {
	return isAllowedValue(value, AISLE_PREFIXES);
};

export const isSpecialAisleValue = (value: string): boolean => {
	return isAllowedValue(value, SPECIAL_AISLE_VALUES);
};
