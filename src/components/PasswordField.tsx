import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Check, Eye, EyeOff, Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { passwordChecks, passwordStrength } from "@/lib/password";

const STRENGTH_TONES = [
  "bg-red-500",
  "bg-red-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-emerald-500",
];

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Optional email — adds a "doesn't contain your email" rule. */
  email?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  /** Show the live requirement checklist + strength meter (use when setting a password). */
  showRules?: boolean;
  className?: string;
}

export function PasswordField({
  value,
  onChange,
  email,
  placeholder = "Password",
  disabled,
  autoComplete,
  autoFocus,
  showRules = false,
  className,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const checks = passwordChecks(value, email);
  const strength = passwordStrength(value, email);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          type={showPassword ? "text" : "password"}
          className="pl-9 pr-9"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
          aria-label="Toggle password visibility"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showRules && value.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  STRENGTH_TONES[strength.score],
                )}
                style={{ width: `${((strength.score + 1) / 5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {strength.label}
            </span>
          </div>
          <ul className="grid gap-1 sm:grid-cols-2">
            {checks.map((check) => (
              <li
                key={check.label}
                className={cn(
                  "flex items-center gap-1.5 text-[11px]",
                  check.met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                )}
              >
                {check.met ? (
                  <Check className="size-3 shrink-0" />
                ) : (
                  <X className="size-3 shrink-0" />
                )}
                {check.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
