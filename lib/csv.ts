/** CSV für deutsches Excel: Semikolon, CRLF, UTF-8 mit BOM */
export function toCsv(header: string[], rows: Array<Array<string | number | null | undefined>>) {
  const escape = (value: string | number | null | undefined) => {
    if (value == null) return "";
    let s = String(value);
    // Schutz vor Formel-Injection in Excel
    if (/^[=@\t\r]/.test(s) || /^[+-][^\d\s]/.test(s)) s = `'${s}`;
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header, ...rows].map((row) => row.map(escape).join(";"));
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function csvResponse(filename: string, body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
