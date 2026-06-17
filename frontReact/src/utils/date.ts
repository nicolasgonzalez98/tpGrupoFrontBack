/**
 * Formatea una fecha como dd/MM/yyyy, equivalente al pipe `date:'dd/MM/yyyy'` de Angular.
 */
export function formatFecha(value: Date | string | undefined | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
