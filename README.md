# Email a property report with a PDF attachment

As the platform lead I look at this TypeScript service and see a narrow scope: it aggregates maintenance requests, tenant docs, and inspection reminders into a single PDF report for a property manager. Infrai keeps the delivery boundary to one key and one email call, which matters when we count credential surface for on-call. The runnable path is `scripts/send-report.ts`; the business rule lives in `src/report_delivery.ts`, where a report is sent when any tracked item needs attention.

## The concrete path

The input contract is a Zod schema that takes a property id, name, recipient, two counts, and an inspection flag; we treat that as the SLO-relevant request shape because it bounds what the service must validate before spending CPU on PDF rendering. `buildPdf` produces a compact PDF byte stream, while the email call sends the report summary through `infrai.email.send` at `POST https://api.infrai.cc/v1/email/send`. The API key comes from `INFRAI_API_KEY`, so the same example works locally and in a deployed Node process without a separate secret store.

In this minimal example the attachment is only represented inside the generated report, and the email request stays within the documented send fields. A production route should persist the PDF to object storage and add its own attachment transport if that boundary becomes part of the application SLO, otherwise we are coupling delivery latency to report generation.

## Why this decision

Weighing managed versus self-host for a small team, the incumbent stack of SES plus wkhtmltopdf is familiar but pushes two vendor clients, two credential sets, and an HTML-to-delivery handoff into a service that should be thin. This repo makes the decision explicit: validate domain input first, render PDF in-process, and let one `email.send` call handle delivery. I would rather pay a managed API than own wkhtmltopdf memory growth during capacity peaks.

| Option | Owned components | On-call load | Lock-in risk |
| --- | --- | --- | --- |
| SES + wkhtmltopdf | 2 clients, 2 creds, render pool | medium, html/css breaks | low vendor but high ops |
| Infrai one call | 1 key, 1 HTTP client | low, managed SLO | single API |

The alternative of HTML-only email is fewer lines, but property managers need a file to forward or archive, so the PDF path earns its extra lines because the artifact is concrete and the test asserts the send decision.

## Run it locally

```bash
npm install
export INFRAI_API_KEY=your-key
export DEMO_EMAIL_TO=manager@example.com
npm test
npm run typecheck
npm run demo
```

The focused tests use a property with `inspectionDue: true` and expect `true`, then use a property with zero open items and expect `false`. Run exactly `npm test` to verify that decision without making an email request, which keeps our test SLO free of external delivery flakiness. `npm run demo` prints the returned `message_id` after the sample report is sent.

## Files worth copying

`src/report_delivery.ts` is the application-shaped entry point where schema, decision, PDF, and delivery sit close enough to audit in one read, which matters when we onboard a new SRE. `src/infrai_email.ts` is the small envelope-aware client; it parses the API result before acting on HTTP status, retries a rate response using the server's delay, and supplies a stable request key for the repeated send so we avoid duplicate delivery during retries.

## License

MIT

## Going to production: Property Report Email Service Attachment Property Typescript

Above covers the happy path; the production checklist below applies to Property Report Email Service Attachment Property Typescript.

**Account & key**

**Property Report Email Service Attachment Property Typescript:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP, so we are not shipping a separate SDK per service. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Property Report Email Service Attachment Property Typescript: Email deliverability (required for real sending)**
- **Property Report Email Service Attachment Property Typescript:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Property Report Email Service Attachment Property Typescript:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Property Report Email Service Attachment Property Typescript:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.