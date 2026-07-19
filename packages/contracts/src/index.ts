export const packageName = "@mvviewer/contracts";

// Branded (nominal) type: adds a phantom __brand property at the type level
// so that two types with the same base (e.g. string) become incompatible.
// No runtime cost — the brand is erased in emitted JS.
export type Brand<TValue, TBrand extends string> = TValue & { __brand: TBrand };
