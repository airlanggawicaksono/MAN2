"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PreRegisterFormValues {
  primaryId: string;
  fullName: string;
  extra?: string;
}

interface PreRegisterFormProps {
  title: string;
  description: string;
  primaryIdLabel: string;
  primaryIdName: string;
  primaryIdValue: string;
  fullNameValue: string;
  fullNameLabel?: string;
  extraLabel?: string;
  extraName?: string;
  extraValue?: string;
  extraPlaceholder?: string;
  submitLabel: string;
  submittingLabel: string;
  isLoading: boolean;
  errorMessage?: string;
  successMessage?: string | null;
  onChange: (field: keyof PreRegisterFormValues, value: string) => void;
  onSubmit: (event: React.FormEvent) => void | Promise<void>;
}

export function PreRegisterForm({
  title,
  description,
  primaryIdLabel,
  primaryIdName,
  primaryIdValue,
  fullNameValue,
  fullNameLabel = "Nama Lengkap",
  extraLabel,
  extraName,
  extraValue,
  extraPlaceholder,
  submitLabel,
  submittingLabel,
  isLoading,
  errorMessage,
  successMessage,
  onChange,
  onSubmit,
}: PreRegisterFormProps) {
  const hasExtraField = Boolean(extraLabel && extraName);

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-lg border p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>

      <div className={`grid grid-cols-1 gap-4 ${hasExtraField ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"}`}>
        <div className="grid gap-2">
          <Label htmlFor={primaryIdName}>{primaryIdLabel} *</Label>
          <Input
            id={primaryIdName}
            required
            value={primaryIdValue}
            onChange={(event) => onChange("primaryId", event.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="nama_lengkap">{fullNameLabel} *</Label>
          <Input
            id="nama_lengkap"
            required
            value={fullNameValue}
            onChange={(event) => onChange("fullName", event.target.value)}
          />
        </div>

        {hasExtraField ? (
          <div className="grid gap-2">
            <Label htmlFor={extraName}>{extraLabel}</Label>
            <Input
              id={extraName}
              value={extraValue || ""}
              onChange={(event) => onChange("extra", event.target.value)}
              placeholder={extraPlaceholder}
            />
          </div>
        ) : null}
      </div>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm font-medium text-primary">{successMessage}</p> : null}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}

