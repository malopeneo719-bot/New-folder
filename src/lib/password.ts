// Password rules for FINDME. Shared by every place a password is created (the
// sign-in / sign-up cards and both password-reset flows) so the requirements
// and the error copy can't drift apart.

export interface PasswordCheck {
  label: string;
  met: boolean;
}

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "passw0rd",
  "123456789",
  "1234567890",
  "qwerty123",
  "letmein123",
  "iloveyou1",
  "welcome123",
  "admin1234",
  "findme123",
  "theatre123",
  "actor1234",
]);

export const MIN_PASSWORD_LENGTH = 10;

function isCommon(password: string) {
  const normalized = password.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return true;
  if (COMMON_PASSWORDS.has(normalized)) return true;
  // Keyboard runs and repeated characters ("aaaaaaaaaa", "1231231231").
  return /^(.)\1{5,}$/.test(password) || "0123456789".includes(password);
}

/**
 * The live checklist shown under password fields. `email` is optional — when
 * provided it adds a "doesn't contain your email" rule.
 */
export function passwordChecks(password: string, email?: string): PasswordCheck[] {
  const checks: PasswordCheck[] = [
    {
      label: `At least ${MIN_PASSWORD_LENGTH} characters`,
      met: password.length >= MIN_PASSWORD_LENGTH,
    },
    {
      label: "Upper and lowercase letters",
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    { label: "At least one number", met: /\d/.test(password) },
    { label: "At least one symbol (! @ # $ %)", met: /[^A-Za-z0-9\s]/.test(password) },
    { label: "Not a commonly used password", met: password.length > 0 && !isCommon(password) },
  ];

  const localPart = email?.trim().toLowerCase().split("@")[0];
  if (localPart && localPart.length >= 3) {
    checks.push({
      label: "Doesn't contain your email address",
      met: password.length > 0 && !password.toLowerCase().includes(localPart),
    });
  }

  return checks;
}

/** Returns the first unmet requirement as a sentence, or null when it's fine. */
export function passwordProblem(password: string, email?: string): string | null {
  const unmet = passwordChecks(password, email).filter((check) => !check.met);
  if (unmet.length === 0) return null;
  if (unmet.length === 1) return `Your password needs: ${unmet[0].label.toLowerCase()}.`;
  return `Your password still needs ${unmet.length} things: ${unmet
    .map((check) => check.label.toLowerCase())
    .join(", ")}.`;
}

export function passwordStrength(password: string, email?: string) {
  const checks = passwordChecks(password, email);
  const met = checks.filter((check) => check.met).length;
  const bonus = password.length >= 14 ? 1 : 0;
  const score = Math.max(
    0,
    Math.min(4, Math.round((met / checks.length) * 4) + bonus),
  );
  const label = ["Too weak", "Weak", "Fair", "Good", "Strong"][score];
  return { score, label };
}
