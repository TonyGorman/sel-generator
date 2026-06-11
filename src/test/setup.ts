import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom does not implement canvas rendering contexts by default.
// Returning null keeps production fallback logic active in tests.
if (typeof HTMLCanvasElement !== 'undefined') {
	vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
}
