// Where the sign-in email gets its logo.
//
// The artwork lives on the app owner's Cloudinary account and is transformed to
// an email-friendly width at request time, so the file never enters the codebase
// and swapping the artwork needs no deploy: set EMAIL_LOGO_URL to any other
// image URL on the Convex deployment.

/** Cloudinary source, width-capped so the email never carries a 1592px asset. */
const DEFAULT_LOGO_URL =
  "https://res.cloudinary.com/doaj3nv5i/image/upload/w_400,c_fit,q_auto,f_png/v1773021224/cxrf8nxtezkrz0g3cwd0.png";

/** URL of the logo shown at the top of the email, or undefined to omit it. */
export function logoUrl(): string | undefined {
  return process.env.EMAIL_LOGO_URL || DEFAULT_LOGO_URL;
}
