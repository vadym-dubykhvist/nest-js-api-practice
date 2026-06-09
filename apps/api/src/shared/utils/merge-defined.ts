/**
 * Copy only the *defined* keys of `source` onto `target` — correct PATCH
 * semantics. With the global ValidationPipe `transform`, DTO instances carry
 * `undefined` for every absent field (target ES2023 → useDefineForClassFields),
 * so a plain `Object.assign(entity, dto)` would wipe existing values. `null` is
 * preserved (an explicit "clear this field").
 */
export function mergeDefined<T extends object>(target: T, source: object): T {
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) {
      (target as Record<string, unknown>)[key] = value;
    }
  }
  return target;
}
