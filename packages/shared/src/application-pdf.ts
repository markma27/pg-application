import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { APPLICANT_ROLE_ADVISER_REPRESENTATIVE, type FullApplicationSubmission } from "./schemas/application";
import { maskAustralianTaxFileNumber } from "./tfn-mask";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN_X = 48;
const MARGIN_TOP = 52;
const MARGIN_BOTTOM = 48;

const LABEL_BG = rgb(232 / 255, 238 / 255, 247 / 255);
const BORDER = rgb(209 / 255, 209 / 255, 209 / 255);
const TEXT_HEADER = rgb(12 / 255, 39 / 255, 66 / 255);
const TEXT_BODY = rgb(30 / 255, 41 / 255, 59 / 255);
const ACCENT = rgb(5 / 255, 150 / 255, 105 / 255);

const LABEL_COL_W = 168;
const FONT_SIZE = 9;
const FONT_SIZE_BOLD = 9;
const LINE_H = 11;
const ROW_PAD = 6;

const DASH = "-";

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

function serviceCodesSummary(codes: string[]): string {
  const labels = [...new Set(codes)]
    .map((c) => SERVICE_CODE_LABEL[c] ?? c)
    .filter(Boolean);
  return labels.join(", ") || DASH;
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
}

export async function buildApplicationPdfBytes(params: BuildApplicationPdfParams): Promise<Uint8Array> {
  const { payload, reference, logoPngBytes, montserratRegularBytes, montserratBoldBytes } = params;
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  let font: PDFFont;
  let fontBold: PDFFont;
  try {
    if (montserratRegularBytes && montserratRegularBytes.byteLength > 0) {
      font = await pdfDoc.embedFont(montserratRegularBytes, { subset: true });
    } else {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
    if (montserratBoldBytes && montserratBoldBytes.byteLength > 0) {
      fontBold = await pdfDoc.embedFont(montserratBoldBytes, { subset: true });
    } else {
      fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }
  } catch {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
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
    ensureSpace(22);
    y -= 6;
    page.drawText(title, {
      x: MARGIN_X,
      y: y - 11,
      size: 11,
      font: fontBold,
      color: TEXT_HEADER,
    });
    y -= 20;
  };

  const drawRow = (label: string, value: string) => {
    const labelLines = wrapLines(label, fontBold, FONT_SIZE_BOLD, LABEL_COL_W - ROW_PAD * 2);
    const valueLines = wrapLines(value, font, FONT_SIZE, valueColW - ROW_PAD * 2);
    const lineCount = Math.max(labelLines.length, valueLines.length);
    const rowH = lineCount * LINE_H + ROW_PAD * 2;
    ensureSpace(rowH);
    const rowBottom = y - rowH;

    page.drawRectangle({
      x: MARGIN_X,
      y: rowBottom,
      width: contentW,
      height: rowH,
      borderColor: BORDER,
      borderWidth: 0.5,
    });
    page.drawRectangle({
      x: MARGIN_X,
      y: rowBottom,
      width: LABEL_COL_W,
      height: rowH,
      color: LABEL_BG,
    });

    const drawColumn = (lines: string[], x: number, size: number, f: PDFFont, color: ReturnType<typeof rgb>) => {
      const colH = lines.length * LINE_H;
      const padTop = (rowH - colH) / 2;
      const topY = rowBottom + rowH - padTop;
      for (let i = 0; i < lines.length; i++) {
        const lineBoxTop = topY - i * LINE_H;
        const baseline = lineBoxTop - LINE_H + (LINE_H - size) / 2 + size * 0.2;
        page.drawText(lines[i]!, { x, y: baseline, size, font: f, color });
      }
    };

    drawColumn(labelLines, MARGIN_X + ROW_PAD, FONT_SIZE_BOLD, fontBold, TEXT_HEADER);
    drawColumn(valueLines, MARGIN_X + LABEL_COL_W + ROW_PAD, FONT_SIZE, font, TEXT_BODY);

    y = rowBottom;
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
  y -= 28;

  /* Primary applicant */
  drawSectionTitle("Primary applicant");
  drawRow("Name", payload.primaryContactName);
  drawRow("Email", payload.email);
  drawRow("Mobile", payload.phone);
  drawRow("Postal address", payload.postalAddress ?? "");
  drawRow("Applicant role", payload.applicantRole);
  if (payload.applicantRole === APPLICANT_ROLE_ADVISER_REPRESENTATIVE) {
    drawRow(
      "Authority to submit on behalf of client",
      payload.representativeAuthorityConfirmed === true ? "Confirmed" : DASH,
    );
  }
  drawRow("Group / account name", payload.groupName?.trim() || DASH);

  /* Entities — each starts on a new page */
  payload.entities.forEach((entity, i) => {
    newPage();
    drawSectionTitle(`Entity ${i + 1}`);
    drawRow("Entity name", entity.entityName);
    drawRow("Entity type", ENTITY_TYPE_LABEL[entity.entityType] ?? entity.entityType);
    drawRow("Portfolio status", PORTFOLIO_STATUS_LABEL[entity.portfolioStatus] ?? entity.portfolioStatus);
    drawRow("Portfolio HIN", entity.portfolioHin?.trim() || DASH);
    drawRow("Australian Business Number (ABN)", entity.abn?.trim() || DASH);
    drawRow("Tax File Number (TFN)", maskAustralianTaxFileNumber(entity.tfn ?? ""));
    drawRow("Registered for GST", yesNo(entity.registeredForGst));
    drawRow("Primary bank account", yesNo(entity.hasPrimaryBankAccount));
    if (entity.hasPrimaryBankAccount) {
      drawRow("Bank name", entity.primaryBankName?.trim() || DASH);
      drawRow("Account name", entity.primaryBankAccountName?.trim() || DASH);
      drawRow("BSB", entity.primaryBankBsb?.replace(/\s/g, "") || DASH);
      drawRow("Account number", entity.primaryBankAccountNumber?.replace(/\s/g, "") || DASH);
    }
    drawRow("Listed investments", String(entity.listedInvestmentCount ?? 0));
    drawRow("Unlisted investments", String(entity.unlistedInvestmentCount ?? 0));
    drawRow("Property", String(entity.propertyCount ?? 0));
    drawRow("Wrap", String(entity.wrapCount ?? 0));
    drawRow("Bank accounts", String(entity.bankAccountCount ?? 0));
    drawRow("Foreign bank accounts", String(entity.foreignBankAccountCount ?? 0));
    drawRow("Loans", String(entity.loanCount ?? 0));
    drawRow("Cryptocurrencies", String(entity.cryptocurrencyCount ?? 0));
    const otherBits = [
      entity.hasCrypto && "Crypto/alternatives",
      entity.hasForeignInvestments && "Foreign investments",
      entity.otherAssetsText?.trim(),
    ].filter(Boolean) as string[];
    drawRow("Other assets", otherBits.length ? otherBits.join(" · ") : DASH);
  });

  /* Services — starts on a new page */
  newPage();
  drawSectionTitle("Services & commencement");
  const codes = payload.entities[0]?.serviceCodes ?? [];
  drawRow("Services (group)", serviceCodesSummary(codes));
  drawRow("Other comments or notes", payload.servicesComments?.trim() || DASH);
  drawRow("Preferred commencement", payload.entities[0]?.commencementDate ?? DASH);

  /* Individuals — follow directly after Services (no forced page break) */
  payload.individuals.forEach((ind, i) => {
    drawSectionTitle(`Know Your Customer (KYC) – Individual ${i + 1}`);
    drawRow("Name", [ind.title, ind.fullName].filter(Boolean).join(" ").trim() || DASH);
    drawRow(
      "Relationship to account",
      ind.relationshipRoles?.length ? ind.relationshipRoles.map((r) => r.replace(/_/g, " ")).join(", ") : DASH,
    );
    drawRow(
      "Residential address",
      [ind.streetAddress, ind.streetAddressLine2].filter(Boolean).join(", ").trim() || DASH,
    );
    drawRow("Tax File Number", maskAustralianTaxFileNumber(ind.taxFileNumber));
    drawRow("Date of birth", ind.dateOfBirth);
    drawRow("Country of birth", ind.countryOfBirth);
    drawRow("City of birth", ind.city);
    drawRow("Occupation", ind.occupation);
    drawRow("Employer", ind.employer);
    drawRow("Email", ind.email);
  });

  /* Adviser */
  drawSectionTitle("Investment adviser & administration");
  const hasAdv = payload.hasInvestmentAdviser === true;
  drawRow("Has investment adviser", hasAdv ? "Yes" : "No");
  if (hasAdv) {
    drawRow("Adviser name", payload.adviserName?.trim() || DASH);
    drawRow("Company", payload.adviserCompany?.trim() || DASH);
    drawRow("Adviser address", payload.adviserAddress?.trim() || DASH);
    drawRow("Phone", payload.adviserTel?.trim() || DASH);
    drawRow("Email", payload.adviserEmail?.trim() || DASH);
    drawRow("Nominate adviser as primary contact", yesNo(payload.nominateAdviserPrimaryContact));
    drawRow("Authorise adviser access to statements", yesNo(payload.authoriseAdviserAccessStatements));
    drawRow("Authorise deal with adviser direct", yesNo(payload.authoriseDealWithAdviserDirect));
  }
  drawRow("Annual report send to", formatDocumentSend(payload.annualReportSendTo));
  drawRow("Meeting proxy send to", formatDocumentSend(payload.meetingProxySendTo));
  drawRow("Investment offers send to", formatDocumentSend(payload.investmentOffersSendTo));
  const div =
    payload.dividendPreference === "cash"
      ? "Receive in cash"
      : payload.dividendPreference === "reinvest"
        ? "Re-invest"
        : DASH;
  drawRow("Dividend preference", div);

  const bytes = await pdfDoc.save();
  return bytes;
}
