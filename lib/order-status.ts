export const orderStatuses = {
  pending: "Pendiente",
  confirmed: "Venta confirmada",
  delivered: "Entregado",
  cancelled: "Cancelado",
} as const;

export type OrderStatus = keyof typeof orderStatuses;
export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && Object.hasOwn(orderStatuses, value);
}
export const orderTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["delivered", "cancelled", "pending"],
  delivered: ["confirmed"],
  cancelled: ["pending"],
};
export const orderStatusActions: Record<OrderStatus, string> = {
  pending: "Volver a pendiente",
  confirmed: "Confirmar venta",
  delivered: "Marcar como entregado",
  cancelled: "Cancelar pedido",
};
