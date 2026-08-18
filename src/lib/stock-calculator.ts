import { VariantType } from "@prisma/client";

export interface StockCalculationProduct {
  baseStock: number;
  packsPerBox: number;
  boxesPerCarton: number;
  baseUnitName?: string;
}

export interface VariantStockInfo {
  variantId: string;
  type: VariantType;
  name: string;
  sku: string;
  price: number;
  multiplier: number;
  maxPurchasable: number;
  isAvailable: boolean;
}

/**
 * Calculate available stock for a specific multiplier given the baseStock
 */
export function calculateAvailableStock(baseStock: number, multiplier: number): number {
  if (multiplier <= 0) return 0;
  return Math.floor(Math.max(0, baseStock) / multiplier);
}

/**
 * Calculates stock for all three standard hierarchy levels:
 * - Carton: Math.floor(baseStock / (packsPerBox * boxesPerCarton))
 * - Box: Math.floor(baseStock / packsPerBox)
 * - Pack: Math.floor(baseStock / 1)
 */
export function calculateHierarchyStocks(product: StockCalculationProduct) {
  const { baseStock, packsPerBox, boxesPerCarton } = product;
  const packsPerCarton = packsPerBox * boxesPerCarton;

  const cartonStock = calculateAvailableStock(baseStock, packsPerCarton);
  const boxStock = calculateAvailableStock(baseStock, packsPerBox);
  const packStock = calculateAvailableStock(baseStock, 1);

  return {
    cartonStock,
    boxStock,
    packStock,
    packsPerCarton,
    packsPerBox,
    boxesPerCarton,
    baseStock,
  };
}

/**
 * Converts intake quantities (Cartons, Boxes, Packs) into total atomic baseStock units
 */
export function calculateStockIntake(
  cartons: number,
  boxes: number,
  packs: number,
  packsPerBox: number,
  boxesPerCarton: number
): {
  totalPacksFromCartons: number;
  totalPacksFromBoxes: number;
  totalPacks: number;
  totalBaseUnits: number;
} {
  const c = Math.max(0, cartons || 0);
  const b = Math.max(0, boxes || 0);
  const p = Math.max(0, packs || 0);

  const packsPerCarton = packsPerBox * boxesPerCarton;
  const totalPacksFromCartons = c * packsPerCarton;
  const totalPacksFromBoxes = b * packsPerBox;
  const totalBaseUnits = totalPacksFromCartons + totalPacksFromBoxes + p;

  return {
    totalPacksFromCartons,
    totalPacksFromBoxes,
    totalPacks: p,
    totalBaseUnits,
  };
}

/**
 * Determine default multiplier for a VariantType given packaging ratios
 */
export function getDefaultMultiplierForVariantType(
  type: VariantType,
  packsPerBox: number,
  boxesPerCarton: number
): number {
  switch (type) {
    case VariantType.CARTON_CASE:
      return packsPerBox * boxesPerCarton;
    case VariantType.BOOSTER_BOX:
      return packsPerBox;
    case VariantType.SINGLE_PACK:
      return 1;
    case VariantType.STARTER_DECK:
    case VariantType.SPECIAL_SET:
    default:
      return 1;
  }
}

/**
 * Format Thai description of stock hierarchy for display
 */
export function formatHierarchyStockLabel(
  baseStock: number,
  packsPerBox: number,
  boxesPerCarton: number,
  baseUnit = "ซอง"
): string {
  const { cartonStock, boxStock, packStock } = calculateHierarchyStocks({
    baseStock,
    packsPerBox,
    boxesPerCarton,
  });

  if (baseStock <= 0) return "สินค้าหมด (0 ซอง)";

  return `เหลือ ${cartonStock} ลัง (${boxStock} กล่อง / ${packStock} ${baseUnit})`;
}
