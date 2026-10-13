import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password?: string;
  showRequirements?: boolean;
}

export interface PasswordRule {
  id: string;
  label: string;
  met: boolean;
}

export function evaluatePasswordRules(password: string = ''): {
  rules: PasswordRule[];
  score: number;
  label: string;
  color: string;
} {
  const rules: PasswordRule[] = [
    { id: 'length', label: 'At least 8 characters', met: password.length >= 8 },
    { id: 'upper', label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { id: 'lower', label: 'One lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { id: 'number', label: 'One number (0-9)', met: /[0-9]/.test(password) },
    { id: 'special', label: 'One special character (!@#$...)', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const metCount = rules.filter((r) => r.met).length;

  let label = 'Very Weak';
  let color = 'bg-rose-500';

  if (metCount === 0) {
    label = 'Too Weak';
    color = 'bg-zinc-600';
  } else if (metCount <= 2) {
    label = 'Weak';
    color = 'bg-rose-500';
  } else if (metCount === 3) {
    label = 'Fair';
    color = 'bg-amber-500';
  } else if (metCount === 4) {
    label = 'Good';
    color = 'bg-indigo-500';
  } else if (metCount === 5) {
    label = 'Strong';
    color = 'bg-emerald-500';
  }

  return { rules, score: metCount, label, color };
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password = '',
  showRequirements = true,
}) => {
  if (!password) {
    return null;
  }

  const { rules, score, label, color } = evaluatePasswordRules(password);

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-zinc-400">Password strength</span>
        <span
          className={`font-semibold ${
            score <= 2
              ? 'text-rose-400'
              : score === 3
              ? 'text-amber-400'
              : score === 4
              ? 'text-indigo-400'
              : 'text-emerald-400'
          }`}
        >
          {label}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 h-1.5">
        {[1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={`h-full rounded-full transition-all duration-300 ${
              index <= score ? color : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>

      {/* Criteria Checklist */}
      {showRequirements && (
        <div className="pt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center gap-1.5 transition-colors ${
                rule.met ? 'text-emerald-400' : 'text-zinc-500'
              }`}
            >
              {rule.met ? (
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              ) : (
                <X className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
              )}
              <span>{rule.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
