import { z } from "zod";
import { infrai, type EmailResult } from "./infrai_email";

export const reportRequest = z.object({
  propertyId: z.string().min(1),
  propertyName: z.string().min(1),
  recipient: z.string().email(),
  maintenanceOpen: z.number().int().nonnegative(),
  documentsDue: z.number().int().nonnegative(),
  inspectionDue: z.boolean()
});

export type ReportRequest = z.infer<typeof reportRequest>;

function pdfText(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

export function buildPdf(input: ReportRequest): Uint8Array {
  const lines = [
    `Property report: ${input.propertyName}`,
    `Property ID: ${input.propertyId}`,
    `Open maintenance requests: ${input.maintenanceOpen}`,
    `Tenant documents due: ${input.documentsDue}`,
    `Inspection reminder: ${input.inspectionDue ? "required" : "not due"}`
  ];
  const stream = `BT /F1 12 Tf 50 750 Td ${lines.map((line) => `(${pdfText(line)}) Tj 0 -22 Td`).join(" ")} ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\\nstream\\n${stream}\\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];
  let pdf = "%PDF-1.4\\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\\n${object}\\nendobj\\n`; });
  const xref = pdf.length;
  pdf += `xref\\n0 ${objects.length + 1}\\n0000000000 65535 f \\n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \\n`; });
  pdf += `trailer\\n<< /Size ${objects.length + 1} /Root 1 0 R >>\\nstartxref\\n${xref}\\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export function shouldEmailReport(input: ReportRequest): boolean {
  return input.maintenanceOpen > 0 || input.documentsDue > 0 || input.inspectionDue;
}

export async function deliverReport(raw: unknown): Promise<EmailResult | null> {
  const input = reportRequest.parse(raw);
  if (!shouldEmailReport(input)) return null;
  const pdf = buildPdf(input);
  const encoded = Buffer.from(pdf).toString("base64");
  return infrai.email.send({
    to: input.recipient,
    subject: `Property report: ${input.propertyName}`,
    html: `<p>Attached is the current report for ${input.propertyName}.</p><p>PDF bytes: ${encoded.length}</p>`
  });
}
