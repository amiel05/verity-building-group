import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const MAX_BODY_BYTES = 52 * 1024 * 1024;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const TOKEN_LIFETIME_MS = 2 * 60 * 60 * 1000;
const FIELD_LIMITS = {
  firstName: 100,
  lastName: 100,
  email: 254,
  phone: 40,
  location: 500,
  projectType: 100,
  propertyStatus: 100,
  budget: 100,
  intendedUse: 2000,
  stage: 100,
  timing: 2000,
  decisionMakers: 1000,
  message: 10000,
  preferredContact: 40,
  bestTime: 300,
} as const;
type ContactField = keyof typeof FIELD_LIMITS;
export type ContactConfig = {
  secret?: string;
  webhookUrl?: string;
  webhookToken?: string;
  siteUrl?: string;
};
export type ContactResult = {
  status: number;
  body: { ok: boolean; message: string; errors?: Record<string, string> };
};
const fail = (
  status: number,
  message: string,
  errors?: Record<string, string>,
): ContactResult => ({
  status,
  body: { ok: false, message, ...(errors ? { errors } : {}) },
});

export function createFormToken(
  secret: string | undefined,
  now = Date.now(),
): string {
  if (!secret || secret.length < 32) return "";
  const payload = `${now}.${randomBytes(18).toString("hex")}`;
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("hex")}`;
}

export function verifyFormToken(
  token: string,
  secret: string | undefined,
  now = Date.now(),
): boolean {
  if (
    !secret ||
    secret.length < 32 ||
    !/^\d{13}\.[a-f0-9]{36}\.[a-f0-9]{64}$/.test(token)
  )
    return false;
  const [issued, nonce, signature] = token.split(".") as [
    string,
    string,
    string,
  ];
  const age = now - Number(issued);
  if (age < 1000 || age > TOKEN_LIFETIME_MS) return false;
  const expected = createHmac("sha256", secret)
    .update(`${issued}.${nonce}`)
    .digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

/** Bounded, process-local limiter; deploy one replica or replace with a shared limiter. */
export class ContactRateLimiter {
  private entries = new Map<string, { count: number; expires: number }>();
  allow(ip: string, now = Date.now()): boolean {
    for (const [key, entry] of this.entries)
      if (entry.expires <= now) this.entries.delete(key);
    const key = createHash("sha256").update(ip).digest("hex");
    const entry = this.entries.get(key);
    if (entry) {
      if (entry.count >= 5) return false;
      entry.count++;
      return true;
    }
    // Fail closed when full, rather than evicting active limits.
    if (this.entries.size >= 10000) return false;
    this.entries.set(key, { count: 1, expires: now + 15 * 60 * 1000 });
    return true;
  }
}

export function validateFields(form: FormData): {
  fields: Record<ContactField, string>;
  errors: Record<string, string>;
} {
  const fields = {} as Record<ContactField, string>;
  const errors: Record<string, string> = {};
  for (const [name, limit] of Object.entries(FIELD_LIMITS)) {
    const values = form.getAll(name);
    const value = values[0] ?? "";
    if (values.length > 1 || typeof value !== "string") {
      errors[name] = "Enter a single text value.";
      fields[name as ContactField] = "";
      continue;
    }
    const clean = value.trim();
    fields[name as ContactField] = clean;
    if (
      clean.length > limit ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(clean)
    )
      errors[name] =
        `Use no more than ${limit} characters without control characters.`;
  }
  if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
    errors.email = "Enter a valid email address.";
  if (
    fields.phone &&
    (!/^[+\d\s().-]+$/.test(fields.phone) ||
      fields.phone.replace(/\D/g, "").length < 7 ||
      fields.phone.replace(/\D/g, "").length > 15)
  )
    errors.phone = "Enter a valid phone number.";
  if (!fields.email && !fields.phone)
    errors.email =
      "Provide an email address or phone number so we can respond.";
  const choices: Partial<Record<ContactField, string[]>> = {
    projectType: [
      "Land Development",
      "New Home Construction",
      "Renovation",
      "Legacy / Community Project",
    ],
    propertyStatus: [
      "I own the property",
      "Under contract",
      "Searching or evaluating",
      "Not applicable",
    ],
    budget: [
      "Not sure yet",
      "Under $500,000",
      "$500,000–$1 million",
      "$1–$2 million",
      "$2 million+",
    ],
    stage: [
      "Early Idea",
      "Land Search",
      "Design",
      "Permitting",
      "Ready to Build",
    ],
    preferredContact: ["Email", "Phone", "Text Message"],
  };
  for (const [name, options] of Object.entries(choices))
    if (
      fields[name as ContactField] &&
      !options.includes(fields[name as ContactField])
    )
      errors[name] = "Select one of the available options.";
  return { fields, errors };
}

export async function validateFile(file: File): Promise<string | undefined> {
  if (file.size > MAX_FILE_BYTES) return "Each file must be 50 MB or smaller.";
  if (file.name.length > 240 || /[\x00-\x1f/\\]/.test(file.name))
    return "Use a simple filename without path separators.";
  const ext = file.name.split(".").pop()?.toLowerCase();
  const bytes = Buffer.from(await file.slice(0, 4096).arrayBuffer());
  const starts = (...signature: number[]) =>
    signature.every((value, index) => bytes[index] === value);
  const allowed: Record<string, { mime: string[]; valid: boolean }> = {
    pdf: {
      mime: ["application/pdf"],
      valid: bytes.subarray(0, 5).toString() === "%PDF-",
    },
    jpg: { mime: ["image/jpeg"], valid: starts(255, 216, 255) },
    jpeg: { mime: ["image/jpeg"], valid: starts(255, 216, 255) },
    png: {
      mime: ["image/png"],
      valid: starts(137, 80, 78, 71, 13, 10, 26, 10),
    },
    webp: {
      mime: ["image/webp"],
      valid:
        bytes.subarray(0, 4).toString() === "RIFF" &&
        bytes.subarray(8, 12).toString() === "WEBP",
    },
    doc: {
      mime: ["application/msword"],
      valid: starts(208, 207, 17, 224, 161, 177, 26, 225),
    },
    docx: {
      mime: [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      valid: starts(80, 75, 3, 4),
    },
  };
  const rule = ext ? allowed[ext] : undefined;
  if (!rule || !rule.valid || (file.type && !rule.mime.includes(file.type)))
    return "Upload a valid PDF, JPEG, PNG, WebP, DOC, or DOCX file.";
  if (ext === "docx") {
    // Check ZIP central-directory metadata without decompressing untrusted data.
    const archive = Buffer.from(await file.arrayBuffer());
    let end = archive.length - 22;
    const minimum = Math.max(0, end - 65535);
    while (end >= minimum && archive.readUInt32LE(end) !== 0x06054b50) end--;
    if (
      end < minimum ||
      archive.readUInt16LE(end + 4) !== 0 ||
      archive.readUInt16LE(end + 6) !== 0
    )
      return "Upload a valid DOCX document.";
    const count = archive.readUInt16LE(end + 10);
    let offset = archive.readUInt32LE(end + 16);
    const names = new Set<string>();
    for (let index = 0; index < count; index++) {
      if (
        offset + 46 > end ||
        archive.readUInt32LE(offset) !== 0x02014b50 ||
        archive.readUInt16LE(offset + 8) & 1
      )
        return "Upload an unencrypted DOCX document.";
      const length = archive.readUInt16LE(offset + 28);
      const next =
        offset +
        46 +
        length +
        archive.readUInt16LE(offset + 30) +
        archive.readUInt16LE(offset + 32);
      if (next > end) return "Upload a valid DOCX document.";
      names.add(
        archive.subarray(offset + 46, offset + 46 + length).toString("utf8"),
      );
      offset = next;
    }
    if (
      !names.has("[Content_Types].xml") ||
      !names.has("word/document.xml") ||
      names.has("word/vbaProject.bin")
    )
      return "Upload a valid DOCX document without macros.";
  }
  // Signatures validate format only, not malware. Receiving integration must quarantine/scan attachments.
  return undefined;
}

async function boundedFormData(request: Request): Promise<FormData> {
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;"))
    throw new Error("format");
  const declared = request.headers.get("content-length");
  if (
    declared &&
    (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_BYTES)
  )
    throw new Error("size");
  if (!request.body) throw new Error("format");
  const reader = request.body.getReader();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    void reader.cancel().catch(() => {});
  }, 30000);
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (timedOut) throw new Error("timeout");
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error("size");
      }
      chunks.push(value);
    }
  } finally {
    clearTimeout(timeout);
    reader.releaseLock();
  }
  return new Response(Buffer.concat(chunks), {
    headers: { "content-type": request.headers.get("content-type")! },
  }).formData();
}

const limiter = new ContactRateLimiter();
export async function handleContact(
  request: Request,
  config: ContactConfig,
  ip: string,
  dependencies: {
    fetch?: typeof fetch;
    limiter?: ContactRateLimiter;
    now?: number;
  } = {},
): Promise<ContactResult> {
  if (request.method !== "POST")
    return fail(405, "Use POST to submit this form.");
  let endpoint: URL;
  try {
    endpoint = new URL(config.webhookUrl ?? "");
    if (
      endpoint.protocol !== "https:" ||
      endpoint.username ||
      endpoint.password ||
      !config.secret ||
      config.secret.length < 32
    )
      throw new Error();
  } catch {
    return fail(
      503,
      "The inquiry form is temporarily unavailable. Please contact us by phone or email.",
    );
  }
  let origin: string;
  try {
    origin = new URL(config.siteUrl || request.url).origin;
  } catch {
    return fail(503, "The inquiry form is temporarily unavailable.");
  }
  if (request.headers.get("origin") !== origin)
    return fail(403, "Please submit the form from this website.");
  if (!(dependencies.limiter ?? limiter).allow(ip, dependencies.now))
    return fail(429, "Too many attempts. Please try again in 15 minutes.");
  let form: FormData;
  try {
    form = await boundedFormData(request);
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "size" ? 413 : 400,
      "Unable to read this form. Total attachments must be under 52 MB.",
    );
  }
  if (form.get("website")) return fail(400, "Unable to submit this form.");
  const token = form.get("token");
  if (
    typeof token !== "string" ||
    form.getAll("token").length !== 1 ||
    !verifyFormToken(token, config.secret, dependencies.now)
  )
    return fail(400, "This form has expired. Reload the page and try again.");
  const { fields, errors } = validateFields(form);
  const files = form
    .getAll("files")
    .filter((item) => typeof item !== "string" && item.size > 0) as File[];
  if (form.getAll("files").some((item) => typeof item === "string"))
    errors.files = "Choose files using the upload control.";
  if (files.length > 8) errors.files = "Upload no more than 8 files.";
  for (const file of files) {
    const error = await validateFile(file);
    if (error) errors.files = error;
  }
  if (Object.keys(errors).length)
    return fail(422, "Please check the highlighted fields.", errors);
  const delivery = new FormData();
  for (const [name, value] of Object.entries(fields)) delivery.set(name, value);
  for (const file of files) delivery.append("files", file, file.name);
  try {
    const response = await (dependencies.fetch ?? fetch)(endpoint, {
      method: "POST",
      body: delivery,
      redirect: "error",
      signal: AbortSignal.timeout(20000),
      headers: config.webhookToken
        ? { authorization: `Bearer ${config.webhookToken}` }
        : {},
    });
    await response.body?.cancel();
    if (!response.ok)
      return fail(
        502,
        "We could not deliver your inquiry. Please try again or contact us directly.",
      );
  } catch {
    return fail(
      502,
      "We could not deliver your inquiry. Please try again or contact us directly.",
    );
  }
  return {
    status: 200,
    body: {
      ok: true,
      message: "Looking forward to building something together!",
    },
  };
}
