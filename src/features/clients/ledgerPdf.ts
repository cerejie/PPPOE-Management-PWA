import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatDateTime, formatDuration } from '@/lib/format';
import type { Client, Plan, Room } from '@/lib/types';
import type { Ledger, LedgerEntry } from './ledger';

/**
 * jsPDF's built-in Helvetica is WinAnsi-encoded and has no glyph for the peso
 * sign (U+20B1) — it renders as a blank or a stray box. Embedding a Unicode
 * font would add ~300KB to the bundle for one character, so the statement
 * spells the currency out instead.
 */
function pdfMoney(amount: number): string {
  const abs = Math.abs(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? '-' : ''}PHP ${abs}`;
}

function entryRow(e: LedgerEntry): string[] {
  const status = e.failed ? ' (FAILED SYNC)' : e.pending ? ' (PENDING SYNC)' : '';
  return [
    formatDateTime(e.at),
    `${e.title}${status}`,
    e.detail || '—',
    e.amount === null ? '' : pdfMoney(e.amount),
  ];
}

export interface LedgerPdfInput {
  client: Client;
  room: Room | undefined;
  plan: Plan | undefined;
  ledger: Ledger;
  /** Display name of whoever exported it, for the footer. */
  exportedBy: string;
}

/** Build the statement. Returns the doc so callers can save or share it. */
export function buildLedgerPdf(input: LedgerPdfInput): jsPDF {
  const { client, room, plan, ledger, exportedBy } = input;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Client Statement', margin, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Generated ${formatDateTime(new Date().toISOString())}`, pageWidth - margin, 52, {
    align: 'right',
  });
  doc.setTextColor(0);

  const paused = client.paused_at !== null;
  const details: string[][] = [
    ['Client', client.full_name],
    ['PPPoE username', client.pppoe_username],
    ['Room', room?.name ?? '—'],
    ['Plan', plan ? `${plan.name} (${pdfMoney(plan.price)} / ${plan.duration_days} days)` : '—'],
    ['Monthly fee', pdfMoney(client.monthly_fee)],
    ['Account status', client.account_status],
    ['Connection', client.connection_status],
    [
      'Subscription',
      paused
        ? `PAUSED since ${formatDateTime(client.paused_at)} — expiry frozen at ${formatDate(client.expires_at)}`
        : `Expires ${formatDate(client.expires_at)}`,
    ],
    ['Total paid', pdfMoney(ledger.totalPaid)],
    ['Time credited by pauses', formatDuration(ledger.totalCredited)],
  ];

  autoTable(doc, {
    startY: 72,
    body: details,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 140, textColor: 110 },
      1: { fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  const afterDetails = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Ledger', margin, afterDetails + 26);

  autoTable(doc, {
    startY: afterDetails + 36,
    head: [['Date', 'Entry', 'Details', 'Amount']],
    body: ledger.entries.map(entryRow),
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 5, overflow: 'linebreak' },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 96 },
      1: { cellWidth: 110 },
      3: { cellWidth: 82, halign: 'right' },
    },
    margin: { left: margin, right: margin },
    // Correction rows read as red so a negative is unmissable on paper.
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 3) return;
      const entry = ledger.entries[data.row.index];
      if (entry?.amount !== null && entry?.amount !== undefined && entry.amount < 0) {
        data.cell.styles.textColor = [190, 30, 45];
      }
    },
  });

  const notes = [
    'Payments older than 6 months and events beyond the most recent 500 are not mirrored to this device',
    ledger.truncated ? 'this statement may be incomplete' : null,
  ]
    .filter(Boolean)
    .join('; ');

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(130);
    doc.text(`${notes}.`, margin, pageHeight - 28, { maxWidth: pageWidth - margin * 2 });
    doc.text(`Exported by ${exportedBy}`, margin, pageHeight - 16);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 16, {
      align: 'right',
    });
  }

  return doc;
}

export function ledgerFileName(client: Client): string {
  const safe = client.full_name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  const day = new Date().toISOString().slice(0, 10);
  return `statement-${safe || client.pppoe_username}-${day}.pdf`;
}

/**
 * Share the statement where the platform supports sharing files (Android /
 * iOS PWAs), otherwise fall back to a normal download. Returns how it went so
 * the caller can surface it.
 */
export async function exportLedgerPdf(input: LedgerPdfInput): Promise<'shared' | 'downloaded'> {
  const doc = buildLedgerPdf(input);
  const name = ledgerFileName(input.client);
  const blob = doc.output('blob');
  const file = new File([blob], name, { type: 'application/pdf' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    } catch (err) {
      // User dismissed the share sheet — not an error worth surfacing.
      if (err instanceof DOMException && err.name === 'AbortError') return 'shared';
      // Anything else: fall through to a download so the export still happens.
    }
  }

  doc.save(name);
  return 'downloaded';
}
