// Sign-in emails for FIND ME.
//
// Password-reset codes go out through the platform's own email gateway
// (integrations.vly.ai, the same deployment token the rest of the app uses),
// because the built-in auth email service renders a fixed template with its own
// sender name and a "Built with ..." footer — neither of which can be changed
// through its API (it accepts only { to, appName, otp }).
//
// Through the gateway the subject and the HTML/text body below are ours, and we
// ask for "TX THEATRE" as the sender display name. The platform gateway owns the
// sending address, so it still decides the name recipients see next to it.
// The logo at the top of the message comes from brandLogo.ts.
//
// Configuration (Convex deployment environment variables):
//   VLY_INTEGRATION_KEY — the deployment token (already set for this project);
//                         without it the code falls back to the platform's
//                         unbranded template so resets keep working.
//   EMAIL_FROM          — optional address the mail is sent from, e.g.
//                         "no-reply@yourdomain.com" once the domain is verified.
//                         The sender display name is unaffected by this.

import axios from "axios";
import { logoUrl } from "./brandLogo";

/** Name we ask to be shown next to the address in the recipient's inbox. */
const SENDER_NAME = "TX THEATRE";

/** Subject line every sign-in / reset code email uses. */
export const SIGN_IN_SUBJECT = "Sign in to FIND ME";

/** Platform sender used when EMAIL_FROM isn't set (no domain needed to start). */
const DEFAULT_FROM = "noreply@project.freebuff.dev";

const HEADING = "Sign in to FIND ME";
const INTRO = "Enter this code on the sign-in page.";
const FOOTER =
  "This code expires in 1 hour. If you didn't request it, you can safely ignore this email.";

/** Brand colours (from the app theme, as hex — email clients can't read oklch). */
const INDIGO = "#6366f1";
const INK = "#111114";
const BODY_TEXT = "#4b4b57";
const MUTED_TEXT = "#6b6b78";
const HAIRLINE = "#e6e6ec";

/** The HTML body of the code email. No other footer or branding is added. */
export function signInEmailHtml(code: string): string {
  const logo = logoUrl();
  const logoBlock = logo
    ? `<div style="text-align:center;margin:0 0 26px;"><img src="${logo}" alt="TX THEATRE" width="200" height="137" style="display:block;margin:0 auto;width:200px;max-width:100%;height:auto;border:0;border-radius:10px;" /></div>`
    : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${HEADING}</title>
  </head>
  <body style="margin:0;padding:32px 16px;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
    <div style="max-width:480px;margin:0 auto;background-color:#ffffff;border:1px solid ${HAIRLINE};border-radius:18px;overflow:hidden;">
      <div style="height:6px;background-color:${INDIGO};"></div>
      <div style="padding:36px 32px;">
        ${logoBlock}
        <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;font-weight:800;letter-spacing:-0.01em;color:${INK};">${HEADING}</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${BODY_TEXT};">${INTRO}</p>
        <div style="margin:0 0 24px;text-align:center;">
          <div style="display:inline-block;padding:18px 24px;border:1px solid ${HAIRLINE};border-radius:14px;background-color:#f8f8fb;">
            <span style="font-size:34px;line-height:1.1;font-weight:800;letter-spacing:10px;color:${INK};font-family:'SFMono-Regular',Menlo,Consolas,'Liberation Mono',monospace;">${code}</span>
          </div>
        </div>
        <p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED_TEXT};">${FOOTER}</p>
      </div>
    </div>
  </body>
</html>`;
}

/** Plain-text version of the same message. */
export function signInEmailText(code: string): string {
  return `${HEADING}\n\n${INTRO}\n\n${code}\n\n${FOOTER}\n`;
}

/** Turn a provider error into something a person can act on. */
function describeSendFailure(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; error?: string | { message?: string }; name?: string }
      | undefined;
    const detail =
      typeof data?.error === "string"
        ? data.error
        : (data?.error?.message ?? data?.message);
    if (typeof detail === "string" && detail.length > 0) return detail;
    if (error.response?.status) {
      return `the email service responded with HTTP ${error.response.status}`;
    }
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * Send the six-digit sign-in code to one address.
 *
 * Falls back to the platform's built-in email service only while
 * VLY_INTEGRATION_KEY is missing, so resets keep working during setup.
 */
export async function sendSignInEmail({ to, code }: { to: string; code: string }) {
  const token = process.env.VLY_INTEGRATION_KEY;

  if (!token) {
    await axios.post(
      "https://auth.freebuff.app/send_otp",
      { to, otp: code, appName: SENDER_NAME },
      { headers: { "x-api-key": "fb_email_2crN1hqIArZP2bEfvjp5Qik4" } },
    );
    return;
  }

  const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;

  try {
    await axios.post(
      "https://integrations.vly.ai/v1/email/send",
      {
        to: [to],
        from: `${SENDER_NAME} <${from}>`,
        subject: SIGN_IN_SUBJECT,
        html: signInEmailHtml(code),
        text: signInEmailText(code),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Vly-Version": "0.1.0",
        },
      },
    );
  } catch (error) {
    throw new Error(
      `We couldn't send the sign-in email (${describeSendFailure(error)}).`,
    );
  }
}
