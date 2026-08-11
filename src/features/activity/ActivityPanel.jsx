import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Loader2,
  Phone,
  User,
} from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

export default function ActivityPanel({
  userId,
}) {
  const [activities, setActivities] =
    useState([]);
  const [loading, setLoading] =
    useState(true);

  const loadActivity = useCallback(
    async () => {
      if (!userId) {
        setActivities([]);
        setLoading(false);
        return;
      }

      const { data, error } =
        await supabase.rpc(
          "get_my_donation_activity"
        );

      if (error) {
        console.error(
          "Activity loading failed:",
          error
        );

        setActivities([]);
      } else {
        setActivities(
          Array.isArray(data) ? data : []
        );
      }

      setLoading(false);
    },
    [userId]
  );

  useEffect(() => {
    loadActivity();

    const channel = supabase
      .channel(
        `caresync-activity-${userId}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "donations",
        },
        () => {
          loadActivity();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadActivity, userId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />

          <p className="text-sm text-slate-600">
            Loading your activity...
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
          My Activity
        </p>

        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Donations & Claims
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          See who claimed your food and who published
          food you claimed.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <Clock3 className="mx-auto h-8 w-8 text-slate-400" />

          <p className="mt-3 font-medium text-slate-700">
            No activity yet
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Your published and claimed resources
            will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((item) => {
            const publisher =
              item.publisher;

            const claimer =
              item.claimer;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />

                      <h3 className="font-semibold text-slate-900">
                        {item.food_type}
                      </h3>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Quantity: {item.quantity}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === "claimed"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {item.status === "claimed"
                      ? "Claimed"
                      : "Available"}
                  </span>
                </div>

                {item.is_publisher &&
                  item.status === "claimed" &&
                  claimer && (
                    <div className="mt-4 rounded-xl bg-emerald-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        Claimed by
                      </p>

                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-emerald-700" />
                          <span className="font-medium">
                            {claimer.full_name ||
                              "Unknown user"}
                          </span>
                        </div>

                        {claimer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-emerald-700" />
                            <span>
                              {claimer.phone}
                            </span>
                          </div>
                        )}

                        {claimer.organization && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-emerald-700" />
                            <span>
                              {claimer.organization}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {!item.is_publisher &&
                  item.status === "claimed" &&
                  publisher && (
                    <div className="mt-4 rounded-xl bg-blue-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                        Food Publisher
                      </p>

                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-700" />
                          <span className="font-medium">
                            {publisher.full_name ||
                              "Unknown user"}
                          </span>
                        </div>

                        {publisher.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-blue-700" />
                            <span>
                              {publisher.phone}
                            </span>
                          </div>
                        )}

                        {publisher.organization && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-700" />
                            <span>
                              {publisher.organization}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}