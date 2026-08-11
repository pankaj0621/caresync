
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  CheckCircle2,
  LogOut,
  MapPin,
  Package,
  Radio,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useDonations } from "@/hooks/useDonations";

import { supabase } from "@/lib/supabaseClient";

import AuthForm from "@/features/auth/AuthForm";
import DonationForm from "@/features/donations/DonationForm";
import DonationMap from "@/features/map/DonationMap";
import ActivityPanel from "@/features/activity/ActivityPanel";
import ClaimSuccess from "@/components/ClaimSuccess";

function App() {
  // ============================================================
  // AUTH
  // ============================================================

  const {
    user,
    profile,
    loading: authLoading,
    logout,
  } = useAuth();

  // ============================================================
  // DONATIONS
  // ============================================================

  const {
    donations,
    loading: donationsLoading,
    error: donationsError,
    claimDonation,
    refetch,
  } = useDonations();

  // ============================================================
  // USER LOCATION
  // ============================================================

  const [userLocation, setUserLocation] =
    useState(null);

  const [locationLoading, setLocationLoading] =
    useState(true);

  // ============================================================
  // NETWORK
  // ============================================================

  const [networkStatus, setNetworkStatus] =
    useState("connecting");

  // ============================================================
  // CLAIM RESULT
  // ============================================================

  const [claimResult, setClaimResult] =
    useState(null);

  // ============================================================
  // LOCATION
  // ============================================================

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  // ============================================================
  // REALTIME NETWORK
  // ============================================================

  useEffect(() => {
    const channel = supabase
      .channel("caresync-network-status")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "donations",
        },
        () => {
          setNetworkStatus("operational");
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setNetworkStatus("operational");
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setNetworkStatus("offline");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ============================================================
  // STATISTICS
  // ============================================================

  const availableResources =
    donations?.length ?? 0;

  const activeLocations = useMemo(() => {
    if (!donations?.length) {
      return 0;
    }

    const locations = new Set(
      donations.map(
        (donation) =>
          `${Number(donation.lat).toFixed(
            5
          )},${Number(donation.lng).toFixed(5)}`
      )
    );

    return locations.size;
  }, [donations]);

  // ============================================================
  // CLAIM
  // ============================================================

  const handleClaimDonation = async (
    donation
  ) => {
    if (!user?.id) {
      toast.error(
        "Please sign in before claiming food."
      );

      return null;
    }

    if (
      donation?.publisher_id === user.id
    ) {
      toast.error(
        "You cannot claim your own food."
      );

      return null;
    }

    try {
      const result =
        await claimDonation(donation.id);

      setClaimResult(result);

      return result;
    } catch (error) {
      console.error(
        "Claim donation error:",
        error
      );

      throw error;
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = async () => {
    try {
      await logout();

      toast.success(
        "You have been logged out."
      );
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );

      toast.error(
        "Could not log out. Please try again."
      );
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

          <p className="font-semibold text-slate-800">
            Loading CareSync...
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Connecting to the food rescue network
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // NOT LOGGED IN
  // ============================================================

  if (!user) {
    return <AuthForm />;
  }

  // ============================================================
  // MAIN APP
  // ============================================================

  const isNetworkOperational =
    networkStatus === "operational";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold tracking-tight">
                Care
              </span>

              <span className="text-2xl font-bold tracking-tight text-emerald-600">
                Sync
              </span>
            </div>

            <p className="mt-0.5 text-sm text-slate-500">
              Real-time surplus food distribution
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-medium sm:flex ${
                isNetworkOperational
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isNetworkOperational
                    ? "animate-pulse bg-emerald-500"
                    : "bg-amber-500"
                }`}
              />

              {isNetworkOperational
                ? "Live Network"
                : "Connecting..."}
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 sm:flex">
              <User className="h-4 w-4 text-emerald-600" />

              <div className="max-w-[150px]">
                <p className="truncate text-sm font-semibold">
                  {profile?.full_name ||
                    "CareSync User"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />

              <span className="hidden sm:inline">
                Logout
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          MAIN
      ======================================================== */}

      <main className="mx-auto max-w-[1600px] px-5 py-8 lg:px-8 lg:py-12">
        {/* ======================================================
            HERO
        ====================================================== */}

        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-emerald-600">
            <Radio className="h-4 w-4" />

            Food Rescue Network
          </div>

          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Turn surplus food into{" "}
            <span className="text-emerald-600">
              immediate impact.
            </span>
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            CareSync connects food publishers with
            nearby people and distribution teams
            through a real-time food rescue network.
          </p>
        </section>

        {/* ======================================================
            STATS
        ====================================================== */}

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <StatCard
            icon={
              <Package className="h-7 w-7" />
            }
            title="Available Resources"
            value={
              donationsLoading
                ? "—"
                : availableResources
            }
          />

          <StatCard
            icon={
              <MapPin className="h-7 w-7" />
            }
            title="Active Locations"
            value={
              donationsLoading
                ? "—"
                : activeLocations
            }
          />

          <StatCard
            icon={
              <Activity className="h-7 w-7" />
            }
            title="Network Status"
            value={
              isNetworkOperational
                ? "Operational"
                : "Connecting"
            }
            valueClass={
              isNetworkOperational
                ? "text-emerald-600"
                : "text-amber-600"
            }
          />
        </section>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {donationsError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-start gap-3">
              <Activity className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Unable to sync donation data
                </p>

                <p className="mt-1">
                  {donationsError.message ||
                    "Please check your Supabase connection."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            WORKSPACE
        ====================================================== */}

        <section className="grid gap-6 lg:grid-cols-[minmax(320px,440px)_1fr]">
          {/* DONATION FORM */}

          <div className="h-fit">
            <DonationForm
              user={user}
              profile={profile}
            />
          </div>

          {/* MAP */}

          <div className="min-h-[600px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-600" />

                  <h2 className="font-semibold">
                    Live Resource Map
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Available food resources update in
                  real time
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

                Live
              </div>
            </div>

            <div className="h-[550px]">
              {locationLoading ? (
                <div className="flex h-full items-center justify-center bg-slate-50">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

                    <p className="font-medium text-slate-700">
                      Finding your location...
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      The map will use a default
                      location if access is denied.
                    </p>
                  </div>
                </div>
              ) : (
                <DonationMap
  donations={donations}
  loading={donationsLoading}
  currentUserId={user?.id}
  onClaim={(donationId) => {
    // useDonations already removes it,
    // this callback is just for UI synchronization.
    console.log("Claimed donation:", donationId);
  }}
/>
              )}
            </div>
          </div>
        </section>

        {/* ======================================================
            ACTIVITY
        ====================================================== */}

        <div className="mt-8">
          <ActivityPanel userId={user.id} />
        </div>

        {/* ======================================================
            HOW IT WORKS
        ====================================================== */}

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            How CareSync works
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            From surplus to impact in three steps.
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <Step
              number="01"
              title="Register once"
              description="Create your profile with your name, phone and organization details."
            />

            <Step
              number="02"
              title="Publish or find food"
              description="Publish surplus food or discover available resources near you."
            />

            <Step
              number="03"
              title="Claim & connect"
              description="Claim available food and securely receive the publisher's contact details."
            />
          </div>
        </section>

        {/* ======================================================
            TRUST
        ====================================================== */}

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <TrustCard
            icon={
              <ShieldCheck className="h-5 w-5" />
            }
            title="Secure profiles"
            description="Your details are stored once and protected."
          />

          <TrustCard
            icon={
              <Users className="h-5 w-5" />
            }
            title="Connected network"
            description="Publishers and claimers can coordinate directly."
          />

          <TrustCard
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            title="Zero duplicate claims"
            description="Each available resource can only be claimed once."
          />
        </section>
      </main>

      {/* ========================================================
          FOOTER
      ======================================================== */}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>
            © {new Date().getFullYear()} CareSync.
            Food rescue, coordinated in real time.
          </p>

          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isNetworkOperational
                  ? "bg-emerald-500"
                  : "bg-amber-500"
              }`}
            />

            <span>
              {isNetworkOperational
                ? "Supabase realtime connected"
                : "Reconnecting to network"}
            </span>
          </div>
        </div>
      </footer>

      {/* ========================================================
          CLAIM SUCCESS MODAL
      ======================================================== */}

      {claimResult && (
        <ClaimSuccess
          result={claimResult}
          onClose={() =>
            setClaimResult(null)
          }
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  valueClass = "text-slate-900",
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          {icon}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p
            className={`mt-1 text-2xl font-bold ${valueClass}`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-600">
        {number}
      </div>

      <div>
        <h3 className="font-semibold">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function TrustCard({
  icon,
  title,
  description,
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-emerald-600">
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold">
          {title}
        </p>

        <p className="text-xs text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

export default App;