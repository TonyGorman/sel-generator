export const LABEL_CONSTRAINTS = {
  aisle: {
    min: 0,
    max: 99,
    prefixes: ['BR', 'BL', 'FL', 'FR', 'PD', 'BM'] as const,
    specialValues: ['FLORAL', 'KIOSK'] as const,
  },
  side: {
    values: ['L', 'R', 'E', 'F'] as const,
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
} as const

export const MIN_AISLE_VALUE = LABEL_CONSTRAINTS.aisle.min
export const MAX_AISLE_VALUE = LABEL_CONSTRAINTS.aisle.max
export const MIN_BAY_VALUE = LABEL_CONSTRAINTS.bay.min
export const MAX_BAY_VALUE = LABEL_CONSTRAINTS.bay.max
export const MIN_SHELF_LETTER = LABEL_CONSTRAINTS.shelf.min
export const MAX_SHELF_LETTER = LABEL_CONSTRAINTS.shelf.max
export const AISLE_SIDES = LABEL_CONSTRAINTS.side.values
export const AISLE_PREFIXES = LABEL_CONSTRAINTS.aisle.prefixes
export const SHORT_CODE_PREFIXES = LABEL_CONSTRAINTS.shortCode.prefixes
export const SPECIAL_AISLE_VALUES = LABEL_CONSTRAINTS.aisle.specialValues

export const formatTwoDigitValue = (value: number): string => {
  return value.toString().padStart(2, '0')
}

export const AISLE_RANGE_TEXT = `${MIN_AISLE_VALUE}-${MAX_AISLE_VALUE}`
export const BAY_RANGE_TEXT = `${formatTwoDigitValue(MIN_BAY_VALUE)}-${formatTwoDigitValue(MAX_BAY_VALUE)}`
export const SHELF_RANGE_TEXT = `${MIN_SHELF_LETTER}-${MAX_SHELF_LETTER}`

export const normalizeCodeTokens = (values: readonly string[]): string[] => {
  const normalized = values
    .map((value) =>
      value
        .trim()
        .toUpperCase()
        .replace(/[^A-Z]/g, ''),
    )
    .filter((value) => value.length > 0)

  return Array.from(new Set(normalized))
}

const normalizedSetCache = new WeakMap<readonly string[], Set<string>>()

const getNormalizedValueSet = (values: readonly string[]): Set<string> => {
  let set = normalizedSetCache.get(values)
  if (set === undefined) {
    set = new Set(normalizeCodeTokens(values))
    normalizedSetCache.set(values, set)
  }
  return set
}

export const normalizeAllowedValue = (value: string, allowedValues: readonly string[]): string | null => {
  const normalized = value.trim().toUpperCase()
  if (!getNormalizedValueSet(allowedValues).has(normalized)) {
    return null
  }

  return normalized
}

const AISLE_PREFIX_SET: ReadonlySet<string> = new Set(normalizeCodeTokens(AISLE_PREFIXES))
const SHORT_CODE_PREFIX_SET: ReadonlySet<string> = new Set(normalizeCodeTokens(SHORT_CODE_PREFIXES))
const SPECIAL_AISLE_VALUE_SET: ReadonlySet<string> = new Set(normalizeCodeTokens(SPECIAL_AISLE_VALUES))

const isValueInSet = (value: string, set: ReadonlySet<string>): boolean => {
  return set.has(value.trim().toUpperCase())
}

export const isShortCodePrefix = (value: string): boolean => {
  return isValueInSet(value, SHORT_CODE_PREFIX_SET)
}

export const isAislePrefix = (value: string): boolean => {
  return isValueInSet(value, AISLE_PREFIX_SET)
}

// Exported for direct testing; no production code currently imports it.
export const isSpecialAisleValue = (value: string): boolean => {
  return isValueInSet(value, SPECIAL_AISLE_VALUE_SET)
}
