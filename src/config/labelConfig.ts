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

export const convertShelfTokenToNumber = (token: string): string => {
	if (/^\d+$/.test(token)) {
		return String(Number(token));
	}

	if (/^[A-Z]$/i.test(token)) {
		return String(token.toUpperCase().charCodeAt(0) - 64);
	}

	return token;
};

export const convertShelfTokenToLetter = (token: string): string => {
	if (/^\d+$/.test(token)) {
		const numericValue = Number(token);
		if (numericValue >= 1 && numericValue <= 26) {
			return String.fromCharCode(64 + numericValue);
		}
	}

	if (/^[A-Z]$/i.test(token)) {
		return token.toUpperCase();
	}

	return token;
};

export const formatShelfTokenForStyle = (token: string, shelfStyle: 'number' | 'alphabetical'): string => {
	return shelfStyle === 'number' ? convertShelfTokenToNumber(token) : convertShelfTokenToLetter(token);
};

export const getShelfTokenForConfig = (index: number, shelfStyle: 'number' | 'alphabetical'): string => {
	if (shelfStyle === 'number') {
		return `${index + 1}`;
	}

	return String.fromCharCode(65 + index);
};