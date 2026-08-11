import {
  Building2,
  CheckCircle2,
  Phone,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ClaimSuccess({
  result,
  onClose,
}) {
  if (!result) return null;

  const publisher =
    result.publisher;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>

          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            Food Claimed Successfully
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Contact the publisher to coordinate
            pickup.
          </p>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
            Publisher Details
          </p>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-slate-500" />

              <span className="font-medium text-slate-900">
                {publisher?.full_name ||
                  "Not provided"}
              </span>
            </div>

            {publisher?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-slate-500" />

                <a
                  href={`tel:${publisher.phone}`}
                  className="font-medium text-emerald-600 hover:underline"
                >
                  {publisher.phone}
                </a>
              </div>
            )}

            {publisher?.organization && (
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-slate-500" />

                <span>
                  {publisher.organization}
                </span>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={onClose}
          className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700"
        >
          Done
        </Button>
      </div>
    </div>
  );
}