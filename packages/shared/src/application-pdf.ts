import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { APPLICANT_ROLE_ADVISER_REPRESENTATIVE, type FullApplicationSubmission } from "./schemas/application";
import { maskAustralianTaxFileNumber } from "./tfn-mask";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN_X = 48;
const MARGIN_TOP = 52;
const MARGIN_BOTTOM = 56;

const LABEL_BG = rgb(232 / 255, 238 / 255, 247 / 255);
const BORDER = rgb(209 / 255, 209 / 255, 209 / 255);
const TEXT_HEADER = rgb(12 / 255, 39 / 255, 66 / 255);
const TEXT_BODY = rgb(30 / 255, 41 / 255, 59 / 255);
const TEXT_MUTED = rgb(100 / 255, 116 / 255, 139 / 255);
const ACCENT = rgb(5 / 255, 150 / 255, 105 / 255);

const LABEL_COL_W = 200;
const FONT_SIZE = 9;
const FONT_SIZE_BOLD = 9;
const LINE_H = 11;
const ROW_PAD = 6;
const SECTION_GAP = 14;
const SUBHEADER_GAP_TOP = 8;
const SUBHEADER_GAP_BOTTOM = 4;
const SUBHEADER_H = 14;
const SECTION_TITLE_H = 22;
const PAGE_NUM_FONT_SIZE = 8;
const PAGE_NUM_Y = 28;

const DASH = "-";

const STANDARD_CODES = new Set<string>([
  "standard_investment_administration",
  "standard_investment_reporting",
  "annual_reporting",
]);
const ADD_ON_CODES = new Set<string>([
  "monthly_reporting",
  "quarterly_reporting",
  "asic_agent",
  "bas",
  "customised_reporting",
  "audit_liaison",
]);
const PAF_PUAF_CODES = new Set<string>([
  "acnc_ais",
  "responsible_person",
  "franking_credit_refund_support",
  "sub_fund_monthly_statements",
]);

const ENTITY_TYPE_LABEL: Record<string, string> = {
  individual: "Individual",
  trust: "Trust",
  company: "Company",
  smsf: "SMSF",
  paf: "PAF",
  puaf: "PuAF",
};

const PORTFOLIO_STATUS_LABEL: Record<string, string> = {
  new: "New portfolio",
  existing_clean: "Existing portfolio",
  existing_reconciliation: "Existing portfolio (reconciliation)",
  complex_cleanup: "Complex cleanup",
};

const SERVICE_CODE_LABEL: Record<string, string> = {
  standard_investment_administration: "Standard investment administration",
  standard_investment_reporting: "Standard investment reporting",
  annual_reporting: "Annual reporting",
  quarterly_reporting: "Quarterly investment reporting",
  monthly_reporting: "Monthly investment reporting",
  customised_reporting: "Customised reporting",
  bas: "Business activity statement",
  asic_agent: "ASIC agent for companies",
  acnc_ais: "Annual financial statements / Annual information statement",
  responsible_person: "PAF responsible person services",
  audit_liaison: "Audit liaison",
  franking_credit_refund_support: "Franking credit refund application",
  sub_fund_monthly_statements: "PuAF sub-fund monthly statements",
};

function formatDocumentSend(value: FullApplicationSubmission["annualReportSendTo"]): string {
  if (value == null || value === "") return DASH;
  if (value === "not_required") return "Not required";
  if (Array.isArray(value) && value.length > 0) {
    return value.map((v) => (v === "trustee" ? "Individual" : "Adviser")).join(", ");
  }
  return DASH;
}

function yesNo(v: boolean | "" | undefined): string {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return DASH;
}

function wrapLines(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const t = text.trim() || DASH;
  const words = t.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) line = test;
    else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [DASH];
}

function expandPafPuafLabels(code: string): string[] {
  if (code === "acnc_ais") return ["Annual financial statements", "Annual information statement"];
  return [SERVICE_CODE_LABEL[code] ?? code];
}

function categoriseServiceCodes(codes: readonly string[]): {
  standard: string[];
  addOn: string[];
  pafPuaf: string[];
} {
  const uniq = [...new Set(codes)];
  return {
    standard: uniq.filter((c) => STANDARD_CODES.has(c)).map((c) => SERVICE_CODE_LABEL[c] ?? c),
    addOn: uniq.filter((c) => ADD_ON_CODES.has(c)).map((c) => SERVICE_CODE_LABEL[c] ?? c),
    pafPuaf: uniq.filter((c) => PAF_PUAF_CODES.has(c)).flatMap(expandPafPuafLabels),
  };
}

export interface BuildApplicationPdfParams {
  payload: FullApplicationSubmission;
  /** Display reference (e.g. PG-100001). */
  reference: string;
  /** PNG bytes for header logo; optional (header falls back to text). */
  logoPngBytes?: Uint8Array | null;
  /** Montserrat TTF bytes for body text; falls back to Helvetica when absent. */
  montserratRegularBytes?: Uint8Array | null;
  /** Montserrat Bold TTF bytes for labels/headers; falls back to Helvetica-Bold when absent. */
  montserratBoldBytes?: Uint8Array | null;
  /** Timestamp for the "Submitted" line on the first page. Defaults to `new Date()`. */
  submittedAt?: Date;
  /** Uploaded portfolio document filenames, aligned to `payload.entities` by index. */
  entityPortfolioFileNames?: string[][];
}

function formatIsoDate(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!year || !month || !day || month < 1 || month > 12) return iso;
  return `${String(day).padStart(2, "0")} ${months[month - 1]} ${year}`;
}

function formatAdelaideDateTime(d: Date): string {
  const fmt = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Adelaide",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
  return fmt.format(d).replace(/,\s*/g, ", ");
}

type RowItem = { kind: "row"; label: string; value: string };
type ListRowItem = { kind: "listRow"; label: string; items: string[]; bullet?: boolean };
type SubheaderItem = { kind: "subheader"; text: string };
type SectionItem = RowItem | ListRowItem | SubheaderItem;

export async function buildApplicationPdfBytes(params: BuildApplicationPdfParams): Promise<Uint8Array> {
  const {
    payload,
    reference,
    logoPngBytes,
    montserratRegularBytes,
    montserratBoldBytes,
    submittedAt,
    entityPortfolioFileNames,
  } = params;
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  let font: PDFFont;
  let fontBold: PDFFont;
  try {
    font =
      montserratRegularBytes && montserratRegularBytes.byteLength > 0
        ? await pdfDoc.embedFont(montserratRegularBytes, { subset: true })
        : await pdfDoc.embedFont(StandardFonts.Helvetica);
    fontBold =
      montserratBoldBytes && montserratBoldBytes.byteLength > 0
        ? await pdfDoc.embedFont(montserratBoldBytes, { subset: true })
        : await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  } catch {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  let page: PDFPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
  const contentW = PAGE_W - MARGIN_X * 2;
  const valueColW = contentW - LABEL_COL_W;

  let y = PAGE_H - MARGIN_TOP;

  const newPage = () => {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN_TOP;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN_BOTTOM) newPage();
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(SECTION_TITLE_H);
    page.drawText(title, {
      x: MARGIN_X,
      y: y - 11,
      size: 11,
      font: fontBold,
      color: TEXT_HEADER,
    });
    y -= SECTION_TITLE_H;
  };

  const drawSubheader = (text: string) => {
    y -= SUBHEADER_GAP_TOP;
    page.drawText(text.toUpperCase(), {
      x: MARGIN_X,
      y: y - 9,
      size: 8,
      font: fontBold,
      color: ACCENT,
    });
    y -= SUBHEADER_H + SUBHEADER_GAP_BOTTOM;
  };

  const measureRow = (label: string, value: string): number => {
    const labelLines = wrapLines(label, fontBold, FONT_SIZE_BOLD, LABEL_COL_W - ROW_PAD * 2);
    const valueLines = wrapLines(value, font, FONT_SIZE, valueColW - ROW_PAD * 2);
    const lineCount = Math.max(labelLines.length, valueLines.length);
    return lineCount * LINE_H + ROW_PAD * 2;
  };

  const measureListRow = (label: string, items: string[], bullet: boolean): number => {
    const labelLines = wrapLines(label, fontBold, FONT_SIZE_BOLD, LABEL_COL_W - ROW_PAD * 2);
    const list = items.length ? items : [DASH];
    let valueLineCount = 0;
    for (const it of list) {
      const text = bullet ? `• ${it}` : it;
      valueLineCount += wrapLines(text, font, FONT_SIZE, valueColW - ROW_PAD * 2).length;
    }
    const lineCount = Math.max(labelLines.length, valueLineCount);
    return lineCount * LINE_H + ROW_PAD * 2;
  };

  const measureItem = (item: SectionItem): number => {
    if (item.kind === "row") return measureRow(item.label, item.value);
    if (item.kind === "listRow") return measureListRow(item.label, item.items, item.bullet !== false);
    return SUBHEADER_GAP_TOP + SUBHEADER_H + SUBHEADER_GAP_BOTTOM;
  };

  const measureSection = (title: string | null, items: SectionItem[]): number => {
    let h = 0;
    if (title) h += SECTION_TITLE_H;
    for (const it of items) h += measureItem(it);
    return h;
  };

  const drawColumn = (
    lines: string[],
    x: number,
    size: number,
    f: PDFFont,
    color: ReturnType<typeof rgb>,
    rowBottom: number,
    rowH: number,
  ) => {
    const colH = lines.length * LINE_H;
    const padTop = (rowH - colH) / 2;
    const topY = rowBottom + rowH - padTop;
    for (let i = 0; i < lines.length; i++) {
      const lineBoxTop = topY - i * LINE_H;
      const baseline = lineBoxTop - LINE_H + (LINE_H - size) / 2 + size * 0.2;
      page.drawText(lines[i]!, { x, y: baseline, size, font: f, color });
    }
  };

  const drawRowFrame = (rowBottom: number, rowH: number) => {
    page.drawRectangle({
      x: MARGIN_X,
      y: rowBottom,
      width: LABEL_COL_W,
      height: rowH,
      color: LABEL_BG,
    });
    page.drawRectangle({
      x: MARGIN_X,
      y: rowBottom,
      width: contentW,
      height: rowH,
      borderColor: BORDER,
      borderWidth: 0.5,
    });
    page.drawLine({
      start: { x: MARGIN_X + LABEL_COL_W, y: rowBottom },
      end: { x: MARGIN_X + LABEL_COL_W, y: rowBottom + rowH },
      thickness: 0.5,
      color: BORDER,
    });
  };

  const drawRow = (label: string, value: string) => {
    const labelLines = wrapLines(label, fontBold, FONT_SIZE_BOLD, LABEL_COL_W - ROW_PAD * 2);
    const valueLines = wrapLines(value, font, FONT_SIZE, valueColW - ROW_PAD * 2);
    const lineCount = Math.max(labelLines.length, valueLines.length);
    const rowH = lineCount * LINE_H + ROW_PAD * 2;
    ensureSpace(rowH);
    const rowBottom = y - rowH;

    drawRowFrame(rowBottom, rowH);
    drawColumn(labelLines, MARGIN_X + ROW_PAD, FONT_SIZE_BOLD, fontBold, TEXT_HEADER, rowBottom, rowH);
    drawColumn(valueLines, MARGIN_X + LABEL_COL_W + ROW_PAD, FONT_SIZE, font, TEXT_BODY, rowBottom, rowH);

    y = rowBottom;
  };

  const drawListRow = (label: string, items: string[], bullet: boolean) => {
    const labelLines = wrapLines(label, fontBold, FONT_SIZE_BOLD, LABEL_COL_W - ROW_PAD * 2);
    const list = items.length ? items : [DASH];
    const valueLines: string[] = [];
    for (const it of list) {
      const text = bullet ? `• ${it}` : it;
      const wrapped = wrapLines(text, font, FONT_SIZE, valueColW - ROW_PAD * 2);
      valueLines.push(...wrapped);
    }
    const lineCount = Math.max(labelLines.length, valueLines.length);
    const rowH = lineCount * LINE_H + ROW_PAD * 2;
    ensureSpace(rowH);
    const rowBottom = y - rowH;

    drawRowFrame(rowBottom, rowH);
    drawColumn(labelLines, MARGIN_X + ROW_PAD, FONT_SIZE_BOLD, fontBold, TEXT_HEADER, rowBottom, rowH);
    drawColumn(valueLines, MARGIN_X + LABEL_COL_W + ROW_PAD, FONT_SIZE, font, TEXT_BODY, rowBottom, rowH);

    y = rowBottom;
  };

  const drawItem = (item: SectionItem) => {
    if (item.kind === "row") drawRow(item.label, item.value);
    else if (item.kind === "listRow") drawListRow(item.label, item.items, item.bullet !== false);
    else drawSubheader(item.text);
  };

  const drawSection = (
    title: string | null,
    items: SectionItem[],
    opts?: { forceNewPage?: boolean; gapBefore?: number },
  ) => {
    const gap = opts?.gapBefore ?? SECTION_GAP;
    if (opts?.forceNewPage) {
      newPage();
    } else {
      y -= gap;
      const totalH = measureSection(title, items);
      const available = y - MARGIN_BOTTOM;
      if (totalH > available && totalH <= PAGE_H - MARGIN_TOP - MARGIN_BOTTOM) {
        newPage();
      }
    }
    if (title) drawSectionTitle(title);
    for (const it of items) drawItem(it);
  };

  /* Header — logo PNG when provided; otherwise text lockup */
  let headerFromLogo = false;
  if (logoPngBytes && logoPngBytes.byteLength > 0) {
    try {
      const img = await pdfDoc.embedPng(logoPngBytes);
      const maxW = 200;
      const maxH = 56;
      const scale = Math.min(maxW / img.width, maxH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ensureSpace(h + 8);
      const x = (PAGE_W - w) / 2;
      const bottomY = y - h;
      page.drawImage(img, { x, y: bottomY, width: w, height: h });
      y = bottomY - 8;
      headerFromLogo = true;
    } catch {
      /* text fallback below */
    }
  }

  if (!headerFromLogo) {
    ensureSpace(28);
    const t = "PortfolioGuardian";
    const tw = fontBold.widthOfTextAtSize(t, 16);
    page.drawText(t, {
      x: (PAGE_W - tw) / 2,
      y: y - 16,
      size: 16,
      font: fontBold,
      color: TEXT_HEADER,
    });
    y -= 22;
    const sub = "Investment portfolio administration";
    const sw = font.widthOfTextAtSize(sub, 9);
    page.drawText(sub, {
      x: (PAGE_W - sw) / 2,
      y: y - 9,
      size: 9,
      font,
      color: ACCENT,
    });
    y -= 14;
  }

  ensureSpace(36);
  const title = "Application";
  const refText = `Reference: ${reference}`;
  page.drawText(title, {
    x: MARGIN_X,
    y: y - 16,
    size: 16,
    font: fontBold,
    color: TEXT_HEADER,
  });
  const refW = font.widthOfTextAtSize(refText, 11);
  page.drawText(refText, {
    x: PAGE_W - MARGIN_X - refW,
    y: y - 16,
    size: 11,
    font: fontBold,
    color: TEXT_HEADER,
  });
  const submittedText = `Submitted: ${formatAdelaideDateTime(submittedAt ?? new Date())}`;
  const submittedW = font.widthOfTextAtSize(submittedText, 9);
  page.drawText(submittedText, {
    x: PAGE_W - MARGIN_X - submittedW,
    y: y - 28,
    size: 9,
    font,
    color: TEXT_MUTED,
  });
  y -= 36;

  /* Primary applicant */
  const primaryItems: SectionItem[] = [
    { kind: "row", label: "Name", value: payload.primaryContactName },
    { kind: "row", label: "Email", value: payload.email },
    { kind: "row", label: "Mobile", value: payload.phone },
    { kind: "row", label: "Postal address", value: payload.postalAddress ?? "" },
    { kind: "row", label: "Applicant role", value: payload.applicantRole },
  ];
  if (payload.applicantRole === APPLICANT_ROLE_ADVISER_REPRESENTATIVE) {
    primaryItems.push({
      kind: "row",
      label: "Authority to submit on behalf of client",
      value: payload.representativeAuthorityConfirmed === true ? "Confirmed" : DASH,
    });
  }
  primaryItems.push({
    kind: "row",
    label: "Group name",
    value: payload.groupName?.trim() || DASH,
  });
  drawSection("Primary applicant", primaryItems, { gapBefore: 0 });

  /* Entities included */
  const entitySummaryItems: SectionItem[] = [
    { kind: "row", label: "Number of entities", value: String(payload.entities.length) },
    {
      kind: "listRow",
      label: "Entity names",
      items: payload.entities.map((e, i) => `Entity ${i + 1}: ${e.entityName}`),
      bullet: false,
    },
  ];
  drawSection("Entities included", entitySummaryItems);

  /* Entities — each starts on a new page */
  payload.entities.forEach((entity, i) => {
    const items: SectionItem[] = [];
    items.push({ kind: "subheader", text: "Entity details" });
    items.push({ kind: "row", label: "Entity name", value: entity.entityName });
    items.push({
      kind: "row",
      label: "Entity type",
      value: ENTITY_TYPE_LABEL[entity.entityType] ?? entity.entityType,
    });
    items.push({
      kind: "row",
      label: "Portfolio status",
      value: PORTFOLIO_STATUS_LABEL[entity.portfolioStatus] ?? entity.portfolioStatus,
    });
    const portfolioFiles = entityPortfolioFileNames?.[i] ?? [];
    if (portfolioFiles.length > 0) {
      items.push({
        kind: "listRow",
        label: "Portfolio documents",
        items: portfolioFiles,
        bullet: false,
      });
    }
    items.push({ kind: "row", label: "Portfolio HIN", value: entity.portfolioHin?.trim() || DASH });
    items.push({
      kind: "row",
      label: "Australian Business Number (ABN)",
      value: entity.abn?.trim() || DASH,
    });
    items.push({
      kind: "row",
      label: "Tax File Number (TFN)",
      value: maskAustralianTaxFileNumber(entity.tfn ?? ""),
    });
    items.push({ kind: "row", label: "Registered for GST", value: yesNo(entity.registeredForGst) });

    items.push({ kind: "subheader", text: "Primary bank account details" });
    items.push({
      kind: "row",
      label: "Primary bank account",
      value: yesNo(entity.hasPrimaryBankAccount),
    });
    if (entity.hasPrimaryBankAccount) {
      items.push({ kind: "row", label: "Bank name", value: entity.primaryBankName?.trim() || DASH });
      items.push({
        kind: "row",
        label: "Account name",
        value: entity.primaryBankAccountName?.trim() || DASH,
      });
      items.push({ kind: "row", label: "BSB", value: entity.primaryBankBsb?.replace(/\s/g, "") || DASH });
      items.push({
        kind: "row",
        label: "Account number",
        value: entity.primaryBankAccountNumber?.replace(/\s/g, "") || DASH,
      });
    }

    items.push({ kind: "subheader", text: "Asset counts" });
    items.push({ kind: "row", label: "Listed investments", value: String(entity.listedInvestmentCount ?? 0) });
    items.push({
      kind: "row",
      label: "Unlisted investments",
      value: String(entity.unlistedInvestmentCount ?? 0),
    });
    items.push({ kind: "row", label: "Property", value: String(entity.propertyCount ?? 0) });
    items.push({ kind: "row", label: "Wrap", value: String(entity.wrapCount ?? 0) });
    items.push({ kind: "row", label: "Bank accounts", value: String(entity.bankAccountCount ?? 0) });
    items.push({
      kind: "row",
      label: "Foreign bank accounts",
      value: String(entity.foreignBankAccountCount ?? 0),
    });
    items.push({ kind: "row", label: "Loans", value: String(entity.loanCount ?? 0) });
    items.push({
      kind: "row",
      label: "Cryptocurrencies",
      value: String(entity.cryptocurrencyCount ?? 0),
    });
    const otherBits = [
      entity.hasCrypto && "Crypto/alternatives",
      entity.hasForeignInvestments && "Foreign investments",
      entity.otherAssetsText?.trim(),
    ].filter(Boolean) as string[];
    items.push({
      kind: "row",
      label: "Other details & notes",
      value: otherBits.length ? otherBits.join(" · ") : DASH,
    });

    drawSection(`Entity ${i + 1}`, items, { forceNewPage: true });
  });

  /* Services — starts on a new page */
  const codes = payload.entities[0]?.serviceCodes ?? [];
  const { addOn, pafPuaf } = categoriseServiceCodes(codes);
  const servicesItems: SectionItem[] = [];
  servicesItems.push({ kind: "subheader", text: "Standard services" });
  servicesItems.push({
    kind: "listRow",
    label: "Included",
    items: [
      "Monthly investment administration & reconciliation",
      "Annual investment & tax reporting",
      "Registered address / mailbox for portfolio",
    ],
  });
  if (addOn.length > 0) {
    servicesItems.push({ kind: "subheader", text: "Add-on services (Jaquillard Minns)" });
    servicesItems.push({ kind: "listRow", label: "Selected", items: addOn });
  }
  if (pafPuaf.length > 0) {
    servicesItems.push({ kind: "subheader", text: "PAF & PuAF services (Jaquillard Minns)" });
    servicesItems.push({ kind: "listRow", label: "Selected", items: pafPuaf });
  }
  servicesItems.push({ kind: "subheader", text: "Comments & commencement" });
  servicesItems.push({
    kind: "row",
    label: "Other comments or notes",
    value: payload.servicesComments?.trim() || DASH,
  });
  servicesItems.push({
    kind: "row",
    label: "Preferred commencement",
    value: formatIsoDate(payload.entities[0]?.commencementDate),
  });
  drawSection("Services & commencement", servicesItems, { forceNewPage: true });

  /* Individuals — each is its own section; keep each on a single page where possible. */
  payload.individuals.forEach((ind, i) => {
    const kycItems: SectionItem[] = [
      {
        kind: "row",
        label: "Name",
        value: [ind.title, ind.fullName].filter(Boolean).join(" ").trim() || DASH,
      },
      {
        kind: "row",
        label: "Relationship to account",
        value: ind.relationshipRoles?.length
          ? ind.relationshipRoles
              .map((r) => r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
              .join(", ")
          : DASH,
      },
      {
        kind: "row",
        label: "Residential address",
        value: [ind.streetAddress, ind.streetAddressLine2].filter(Boolean).join(", ").trim() || DASH,
      },
      { kind: "row", label: "Tax File Number", value: maskAustralianTaxFileNumber(ind.taxFileNumber) },
      { kind: "row", label: "Date of birth", value: formatIsoDate(ind.dateOfBirth) },
      { kind: "row", label: "Country of birth", value: ind.countryOfBirth },
      { kind: "row", label: "City of birth", value: ind.city },
      { kind: "row", label: "Occupation", value: ind.occupation },
      { kind: "row", label: "Employer", value: ind.employer },
      { kind: "row", label: "Email", value: ind.email },
    ];
    drawSection(`Know Your Customer (KYC) – Individual ${i + 1}`, kycItems);
  });

  /* Adviser */
  const adviserItems: SectionItem[] = [];
  const hasAdv = payload.hasInvestmentAdviser === true;
  adviserItems.push({ kind: "row", label: "Has investment adviser", value: hasAdv ? "Yes" : "No" });
  if (hasAdv) {
    adviserItems.push({ kind: "row", label: "Adviser name", value: payload.adviserName?.trim() || DASH });
    adviserItems.push({ kind: "row", label: "Company", value: payload.adviserCompany?.trim() || DASH });
    adviserItems.push({
      kind: "row",
      label: "Adviser address",
      value: payload.adviserAddress?.trim() || DASH,
    });
    adviserItems.push({ kind: "row", label: "Phone", value: payload.adviserTel?.trim() || DASH });
    adviserItems.push({ kind: "row", label: "Email", value: payload.adviserEmail?.trim() || DASH });
    adviserItems.push({
      kind: "row",
      label: "Nominate adviser as primary contact",
      value: yesNo(payload.nominateAdviserPrimaryContact),
    });
    adviserItems.push({
      kind: "row",
      label: "Authorise adviser access to statements",
      value: yesNo(payload.authoriseAdviserAccessStatements),
    });
    adviserItems.push({
      kind: "row",
      label: "Authorise deal with adviser direct",
      value: yesNo(payload.authoriseDealWithAdviserDirect),
    });
  }
  adviserItems.push({
    kind: "row",
    label: "Annual report send to",
    value: formatDocumentSend(payload.annualReportSendTo),
  });
  adviserItems.push({
    kind: "row",
    label: "Meeting proxy send to",
    value: formatDocumentSend(payload.meetingProxySendTo),
  });
  adviserItems.push({
    kind: "row",
    label: "Investment offers send to",
    value: formatDocumentSend(payload.investmentOffersSendTo),
  });
  const div =
    payload.dividendPreference === "cash"
      ? "Receive in cash"
      : payload.dividendPreference === "reinvest"
        ? "Re-invest"
        : DASH;
  adviserItems.push({ kind: "row", label: "Dividend preference", value: div });

  drawSection("Investment adviser & administration", adviserItems);

  /* End marker */
  y -= 16;
  ensureSpace(14);
  const endText = "-- THE END --";
  const endW = fontBold.widthOfTextAtSize(endText, 10);
  page.drawText(endText, {
    x: (PAGE_W - endW) / 2,
    y: y - 10,
    size: 10,
    font: fontBold,
    color: TEXT_MUTED,
  });
  y -= 14;

  /* Page numbers — drawn after all content so totals are known */
  const pages = pdfDoc.getPages();
  const total = pages.length;
  pages.forEach((p, idx) => {
    const label = `Page ${idx + 1} of ${total}`;
    const w = font.widthOfTextAtSize(label, PAGE_NUM_FONT_SIZE);
    p.drawText(label, {
      x: (PAGE_W - w) / 2,
      y: PAGE_NUM_Y,
      size: PAGE_NUM_FONT_SIZE,
      font,
      color: TEXT_MUTED,
    });
  });

  const bytes = await pdfDoc.save();
  return bytes;
}
