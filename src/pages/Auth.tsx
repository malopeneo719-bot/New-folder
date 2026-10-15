import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { PasswordField } from "@/components/PasswordField";

import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { readableError } from "@/lib/utils";
import { MIN_PASSWORD_LENGTH, passwordProblem } from "@/lib/password";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  LogOut,
} from "lucide-react";
import { useConvex, useQuery } from "convex/react";
import { Suspense, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isAuthenticated, signIn, signOut } = useAuth();
  const convex = useConvex();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [mode, setMode] = useState<"signIn" | "resetEmail" | "resetEmailVerify">(
    "signIn",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const address = email.trim();
  // A new email (or an account created before passwords existed) is setting a
  // password, so the full complexity rules apply. Existing passwords just have
  // to match whatever the person already chose.
  const accountLookup = useQuery(
    api.users.getUserByEmail,
    address.includes("@") ? { email: address } : "skip",
  );
  const isSettingPassword = accountLookup != null && !accountLookup.hasPassword;

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.reload();
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  // Email + password. New emails create an account automatically; existing
  // email+password accounts sign in. Accounts that predate passwords get their
  // first password attached to the same user, so nothing is lost.
  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!address) return;
    setIsLoading(true);
    setError(null);
    let flow: "signIn" | "signUp" = "signIn";
    try {
      const found = await convex.query(api.users.getUserByEmail, { email: address });
      flow = found?.hasPassword ? "signIn" : "signUp";
      if (flow === "signUp") {
        const problem = passwordProblem(password, address);
        if (problem) {
          setError(problem);
          setIsLoading(false);
          return;
        }
      }
      const formData = new FormData();
      formData.set("email", address);
      formData.set("password", password);
      formData.set("flow", flow);
      await signIn("password", formData);
      navigate(redirect);
    } catch (err) {
      console.error("Password sign-in error:", err);
      setError(
        flow === "signIn"
          ? "Incorrect email or password. Please try again."
          : "We couldn't create your account. Please try again.",
      );
    }
    setIsLoading(false);
  };

  // ── Forgot password ──
  // Only accounts that already have a password can reset one.
  const handleStartReset = async () => {
    if (!address) {
      setError('Type your email above first, then tap "Forgot password?".');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const found = await convex.query(api.users.getUserByEmail, { email: address });
      if (!found?.hasPassword) {
        setError("This email doesn't have a password yet — enter one above to continue.");
        setIsLoading(false);
        return;
      }
      setResetCode("");
      setNewPassword("");
      setMode("resetEmail");
    } catch (err) {
      console.error("Password reset error:", err);
      setError(readableError(err, "Something went wrong. Please try again."));
    }
    setIsLoading(false);
  };

  const handleSendResetEmail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("email", address);
      formData.set("flow", "reset");
      await signIn("password", formData);
      setResetCode("");
      setNewPassword("");
      setMode("resetEmailVerify");
    } catch (err) {
      console.error("Password reset email error:", err);
      setError(readableError(err, "We couldn't send a reset code to that email. Please try again."));
    }
    setIsLoading(false);
  };

  const handleCompleteEmailReset = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (resetCode.length !== 6) return;
    const problem = passwordProblem(newPassword, address);
    if (problem) {
      setError(problem);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("email", address);
      formData.set("flow", "reset-verification");
      formData.set("code", resetCode);
      formData.set("newPassword", newPassword);
      await signIn("password", formData);
      setPassword(newPassword);
      navigate(redirect);
    } catch (err) {
      console.error("Password reset verification error:", err);
      setError(readableError(err, "That code didn't work — check and try again."));
      setResetCode("");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* Auth Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center justify-center h-full flex-col">
        <Card className="min-w-[350px] pb-0 border shadow-md">
          <CardHeader className="text-center">                  <div className="flex justify-center">
            <div
              className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-extrabold text-2xl mb-4 mt-4 cursor-pointer"
              onClick={() => navigate("/")}
            >
              F
            </div>
          </div>
            <CardTitle className="text-xl">
              {mode === "signIn" && "Welcome to FINDME"}
              {mode === "resetEmail" && "Reset your password"}
              {mode === "resetEmailVerify" && "Enter your reset code"}
            </CardTitle>
            <CardDescription>
              {mode === "signIn" &&
                (isSettingPassword
                  ? `Create a password with at least ${MIN_PASSWORD_LENGTH} characters, a capital, a number, and a symbol.`
                  : "Sign in with your email and password — new here? Your account is created automatically.")}
              {mode === "resetEmail" && `We'll email a 6-digit reset code to ${address}`}
              {mode === "resetEmailVerify" && `We sent a 6-digit code to ${address}`}
            </CardDescription>
          </CardHeader>

          {mode === "signIn" && (
            <form onSubmit={handlePasswordSubmit}>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="email"
                    placeholder="name@example.com"
                    type="email"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    autoFocus
                  />
                </div>
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  email={address}
                  showRules={isSettingPassword}
                  placeholder={isSettingPassword ? "Create a password" : "Your password"}
                  autoComplete={isSettingPassword ? "new-password" : "current-password"}
                  disabled={isLoading}
                />
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isLoading ||
                    !address.includes("@") ||
                    password.length === 0 ||
                    (isSettingPassword && passwordProblem(password, address) !== null)
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait…
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={handleStartReset}
                    disabled={isLoading}
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>
              </CardContent>
            </form>
          )}

          {mode === "resetEmail" && (
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                Your code goes to <span className="font-medium text-foreground">{address}</span>.
                The email comes from {" "}
                <span className="font-medium text-foreground">FIND ME</span> — if it
                hasn't landed within a minute, check your spam folder.
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button onClick={handleSendResetEmail} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Email me a reset code
                  </>
                )}
              </Button>
              <Button
                variant="link"
                className="w-full text-xs"
                onClick={() => { setMode("signIn"); setError(null); }}
                disabled={isLoading}
              >
                ← Back to sign in
              </Button>
            </CardContent>
          )}

          {mode === "resetEmailVerify" && (
            <form onSubmit={handleCompleteEmailReset}>
              <CardContent className="space-y-3">
                <div className="flex justify-center">
                  <InputOTP
                    value={resetCode}
                    onChange={setResetCode}
                    maxLength={6}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <PasswordField
                  value={newPassword}
                  onChange={setNewPassword}
                  email={address}
                  showRules
                  placeholder="New password"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isLoading ||
                    resetCode.length !== 6 ||
                    passwordProblem(newPassword, address) !== null
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Set new password
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-xs"
                  onClick={() => { setMode("resetEmail"); setError(null); }}
                  disabled={isLoading}
                >
                  Didn't get the code? Send again
                </Button>
              </CardContent>
            </form>
          )}

          <div className="py-4 px-6 text-xs text-center text-muted-foreground bg-muted border-t rounded-b-lg">                  Secured by TxTheatre
          </div>
        </Card>

        {/* Sign out button — shown when already authenticated */}
        {isAuthenticated && mode === "signIn" && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 gap-1.5 text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="size-3.5" /> Sign out to switch accounts
          </Button>
        )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
