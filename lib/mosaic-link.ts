export function normalizeMosaicLink(value: string, origins: string[]) {
  const input = value.trim();
  if (!input || input.startsWith("//") || input.includes("\\"))
    throw new Error(
      "Pegá el enlace de un diseño o una colección de este sitio.",
    );
  let url: URL;
  try {
    url = new URL(input, origins[0]);
  } catch {
    throw new Error("El enlace no es válido.");
  }
  if (
    (!input.startsWith("/") && !/^https?:\/\//i.test(input)) ||
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    !origins.some((origin) => new URL(origin).origin === url.origin)
  )
    throw new Error("El enlace debe pertenecer a este sitio.");
  return url.pathname.replace(/\/+$/, "") || "/";
}
