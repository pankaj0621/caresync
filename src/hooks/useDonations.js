import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---------------------------------------------------------
  // Attach publisher / claimant profiles without using
  // profiles.email because that column does not exist.
  // ---------------------------------------------------------
  const attachProfiles = useCallback(async (rows) => {
    if (!rows || rows.length === 0) {
      return [];
    }

    const profileIds = [
      ...new Set(
        rows
          .flatMap((item) => [
            item.publisher_id,
            item.claimed_by,
          ])
          .filter(Boolean)
      ),
    ];

    if (profileIds.length === 0) {
      return rows;
    }

    const {
      data: profiles,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "id, full_name, phone, organization_name, role"
      )
      .in("id", profileIds);

    if (profileError) {
      console.warn(
        "Profile details could not be loaded:",
        profileError.message
      );

      return rows;
    }

    const profileMap = Object.fromEntries(
      (profiles || []).map((profile) => [
        profile.id,
        profile,
      ])
    );

    return rows.map((donation) => ({
      ...donation,

      publisher_profile:
        profileMap[donation.publisher_id] || null,

      claimant_profile:
        profileMap[donation.claimed_by] || null,
    }));
  }, []);

  // ---------------------------------------------------------
  // Fetch available donations
  // IMPORTANT:
  // No auth.getUser() here.
  // Donations should load independently.
  // ---------------------------------------------------------
  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const {
      data,
      error: fetchError,
    } = await supabase
      .from("donations")
      .select("*")
      .eq("status", "available")
      .order("created_at", {
        ascending: false,
      });

    if (fetchError) {
      console.error(
        "Failed to fetch donations:",
        fetchError
      );

      setError(fetchError.message);
      setDonations([]);
      setLoading(false);

      return;
    }

    const enrichedData = await attachProfiles(
      data || []
    );

    setDonations(enrichedData);
    setLoading(false);
  }, [attachProfiles]);

  // ---------------------------------------------------------
  // Claim donation
  // ---------------------------------------------------------
  const claimDonation = useCallback(
    async (donationId) => {
      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Please sign in before claiming food."
        );
      }

      const {
        data,
        error: claimError,
      } = await supabase.rpc("claim_donation", {
        p_donation_id: donationId,
      });

      if (claimError) {
        console.error(
          "Claim donation failed:",
          claimError
        );

        const message =
          claimError.message || "";

        if (message.includes("OWN_DONATION")) {
          throw new Error(
            "You cannot claim food that you published."
          );
        }

        if (message.includes("ALREADY_CLAIMED")) {
          throw new Error(
            "This food has already been claimed."
          );
        }

        if (message.includes("AUTH_REQUIRED")) {
          throw new Error(
            "Please sign in before claiming food."
          );
        }

        throw new Error(
          "Could not claim this food. Please try again."
        );
      }

      // RPC can return one row or an array depending on setup
      const claimedDonation = Array.isArray(data)
        ? data[0]
        : data;

      // Remove from available list immediately
      setDonations((current) =>
        current.filter(
          (item) => item.id !== donationId
        )
      );

      return claimedDonation;
    },
    []
  );

  // ---------------------------------------------------------
  // Initial fetch + realtime
  // ---------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      await fetchDonations();

      if (!mounted) {
        return;
      }
    };

    load();

    const channel = supabase
      .channel("caresync-donations-realtime")

      // NEW DONATION
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "donations",
        },
        async (payload) => {
          const donation = payload.new;

          if (
            !donation ||
            donation.status !== "available"
          ) {
            return;
          }

          const [enrichedDonation] =
            await attachProfiles([donation]);

          if (!mounted) {
            return;
          }

          setDonations((current) => {
            const exists = current.some(
              (item) =>
                item.id === donation.id
            );

            if (exists) {
              return current;
            }

            return [
              enrichedDonation,
              ...current,
            ];
          });
        }
      )

      // DONATION UPDATED
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "donations",
        },
        async (payload) => {
          const updated = payload.new;

          if (!updated) {
            return;
          }

          if (updated.status === "claimed") {
            setDonations((current) =>
              current.filter(
                (item) =>
                  item.id !== updated.id
              )
            );

            return;
          }

          const [enrichedDonation] =
            await attachProfiles([updated]);

          if (!mounted) {
            return;
          }

          setDonations((current) => {
            const exists = current.some(
              (item) =>
                item.id === updated.id
            );

            if (!exists) {
              return [
                enrichedDonation,
                ...current,
              ];
            }

            return current.map((item) =>
              item.id === updated.id
                ? enrichedDonation
                : item
            );
          });
        }
      )

      // DONATION DELETED
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "donations",
        },
        (payload) => {
          const deletedId =
            payload.old?.id;

          if (!deletedId) {
            return;
          }

          setDonations((current) =>
            current.filter(
              (item) =>
                item.id !== deletedId
            )
          );
        }
      )

      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(
            "CareSync donation realtime connected."
          );
        }

        if (status === "CHANNEL_ERROR") {
          console.error(
            "CareSync realtime channel error."
          );
        }
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [fetchDonations, attachProfiles]);

  return {
    donations,
    loading,
    error,
    refetch: fetchDonations,
    claimDonation,
  };
}