export const MAX_BAY_VALUE = 99;
export const MAX_SHELF_VALUE = 20;
export const MAX_AISLE_VALUE = 99;

// Conservative raster export profile to preserve barcode edge fidelity.
export const PDF_EXPORT_SCALE = 3;
export const PDF_IMAGE_COMPRESSION = 'NONE' as const;

export const getShelfTokenForConfig = (index: number, shelfStyle: 'number' | 'alphabetical'): string => {
	if (shelfStyle === 'number') {
		return `${index + 1}`;
	}

	return String.fromCharCode(65 + index);
};