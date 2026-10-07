import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ContactRateLimiter,
  createFormToken,
  handleContact,
  MAX_BODY_BYTES,
  validateFile,
  validateFields,
  verifyFormToken,
} from "../src/lib/contact.ts";

const secret = "test-only-form-signing-secret-with-32-characters";
const now = 1800000000000;
const config = {
  secret,
  siteUrl: "https://example.test",
  webhookUrl: "https://delivery.example.test/contact",
  webhookToken: "test-only-token",
};

test("all contact form fields remain visible without progressive disclosure", async () => {
  const [component, styles, script] = await Promise.all([
    readFile("src/components/ContactForm.astro", "utf8"),
    readFile("src/styles/site.css", "utf8"),
    readFile("src/scripts/site.ts", "utf8"),
  ]);

  for (const name of [
    "location",
    "projectType",
    "propertyStatus",
    "budget",
    "intendedUse",
    "stage",
    "timing",
    "decisionMakers",
    "files",
    "preferredContact",
    "bestTime",
  ]) {
    assert.match(component, new RegExp(`name=["'{]${name}`));
  }
  assert.doesNotMatch(styles, /inquiry-form:not\(\.is-expanded\)/);
  assert.doesNotMatch(script, /is-expanded/);
  assert.match(
    component,
    /<label for=\{field\("projectType"\)\}>Project Type<\/label>\s*<select[^>]+name="projectType">\s*<option value="">Select project type<\/option>/,
  );
  assert.match(styles, /\.inquiry-fields\s*\{[^}]*row-gap:\s*32px;/s);
});
function request(
  values: Record<string, string> = {},
  origin = config.siteUrl,
): Request {
  const form = new FormData();
  form.set("email", "visitor@example.test");
  form.set("token", createFormToken(secret, now - 2000));
  for (const [name, value] of Object.entries(values)) form.set(name, value);
  return new Request(`${config.siteUrl}/api/contact/`, {
    method: "POST",
    body: form,
    headers: { origin },
  });
}
function deps(fetcher?: typeof fetch) {
  return {
    now,
    limiter: new ContactRateLimiter(),
    ...(fetcher ? { fetch: fetcher } : {}),
  };
}

test("tokens reject tampering, insufficient age, expiry and missing secret", () => {
  const token = createFormToken(secret, now);
  assert.equal(verifyFormToken(token, secret, now + 2000), true);
  assert.equal(verifyFormToken(token, secret, now), false);
  assert.equal(verifyFormToken(token, secret, now + 7200001), false);
  assert.equal(
    verifyFormToken(`${token.slice(0, -1)}z`, secret, now + 2000),
    false,
  );
  assert.equal(verifyFormToken(token, undefined, now + 2000), false);
  assert.equal(createFormToken("short"), "");
});

test("validation requires a usable contact and rejects invalid choices and duplicate fields", () => {
  const form = new FormData();
  assert.ok(validateFields(form).errors.email);
  form.set("phone", "+1 (704) 555-0123");
  form.set("projectType", "Legacy / Community Project");
  form.set("propertyStatus", "Searching or evaluating");
  form.set("budget", "$1–$2 million");
  assert.deepEqual(validateFields(form).errors, {});
  form.set("stage", "Invalid");
  form.set("propertyStatus", "Invalid");
  form.set("budget", "Invalid");
  form.append("phone", "5555555555");
  form.set("message", "x".repeat(10001));
  const { errors } = validateFields(form);
  assert.ok(
    errors.stage &&
      errors.propertyStatus &&
      errors.budget &&
      errors.phone &&
      errors.message,
  );
});

test("rate limiter permits five attempts, isolates addresses, and expires", () => {
  const limiter = new ContactRateLimiter();
  for (let i = 0; i < 5; i++)
    assert.equal(limiter.allow("192.0.2.1", now), true);
  assert.equal(limiter.allow("192.0.2.1", now), false);
  assert.equal(limiter.allow("192.0.2.2", now), true);
  assert.equal(limiter.allow("192.0.2.1", now + 900001), true);
});

test("file extension, MIME, signatures and unsafe names are validated", async () => {
  assert.equal(
    await validateFile(
      new File(["%PDF-1.7\nexample"], "plan.pdf", { type: "application/pdf" }),
    ),
    undefined,
  );
  assert.ok(
    await validateFile(
      new File(["<script>bad</script>"], "plan.pdf", {
        type: "application/pdf",
      }),
    ),
  );
  assert.ok(
    await validateFile(
      new File(["%PDF-1.7"], "plan.pdf", { type: "text/html" }),
    ),
  );
  assert.ok(
    await validateFile(
      new File(["%PDF-1.7"], "../plan.pdf", { type: "application/pdf" }),
    ),
  );
  assert.ok(await validateFile(new File(["file"], "plan.exe")));
  assert.ok(
    await validateFile(
      new File([new Uint8Array([80, 75, 3, 4])], "plan.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ),
  );
});

test("configuration, cross-origin, honeypot and expired token fail without delivery", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => {
    calls++;
    return new Response(null, { status: 200 });
  };
  assert.equal(
    (await handleContact(request(), {}, "test", deps(fetcher))).status,
    503,
  );
  assert.equal(
    (
      await handleContact(
        request({}, "https://attacker.test"),
        config,
        "test",
        deps(fetcher),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handleContact(
        request({ website: "spam" }),
        config,
        "test",
        deps(fetcher),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await handleContact(
        request({ token: "invalid" }),
        config,
        "test",
        deps(fetcher),
      )
    ).status,
    400,
  );
  assert.equal(calls, 0);
});

test("size ceiling checked before parsing", async () => {
  const oversized = new Request(`${config.siteUrl}/api/contact/`, {
    method: "POST",
    body: "small",
    headers: {
      origin: config.siteUrl,
      "content-type": "multipart/form-data; boundary=x",
      "content-length": String(MAX_BODY_BYTES + 1),
    },
  });
  assert.equal(
    (await handleContact(oversized, config, "test", deps())).status,
    413,
  );
});

test("success requires real provider acceptance; delivery excludes anti-spam and private transport data", async () => {
  const fetcher: typeof fetch = async (url, options) => {
    assert.equal(String(url), config.webhookUrl);
    assert.equal(options?.redirect, "error");
    assert.deepEqual(options?.headers, {
      authorization: "Bearer test-only-token",
    });
    const data = options?.body as FormData;
    assert.equal(data.get("email"), "visitor@example.test");
    assert.equal(data.has("token"), false);
    assert.equal(data.has("website"), false);
    return new Response(null, { status: 202 });
  };
  const result = await handleContact(request(), config, "test", deps(fetcher));
  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  const failed = await handleContact(
    request(),
    config,
    "test",
    deps(async () => new Response(null, { status: 500 })),
  );
  assert.equal(failed.status, 502);
  assert.equal(failed.body.ok, false);
  const unavailable = await handleContact(
    request(),
    config,
    "test",
    deps(async () => {
      throw new Error("test failure");
    }),
  );
  assert.equal(unavailable.status, 502);
});
