import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import { useEffect, useState } from "react";

import {
  CheckCircle2,
  Loader2,
  MapPin,
  Navigation,
  UserRound,
  Phone,
  Building2,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { supabase } from "@/lib/supabaseClient";

import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [
  20.5937,
  78.9629,
];

const DEFAULT_ZOOM = 5;

// ---------------------------------------------------------
// Custom food marker
// ---------------------------------------------------------
const donationIcon = L.divIcon({
  className: "caresync-marker",

  html: `
    <div
      style="
        width: 38px;
        height: 38px;
        border-radius: 9999px;
        background: #059669;
        border: 4px solid white;
        box-shadow: 0 4px 14px rgba(0,0,0,.22);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
      "
    >
      🍱
    </div>
  `,

  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -20],
});

// ---------------------------------------------------------
// Map location controller
// ---------------------------------------------------------
function LocationController({
  location,
}) {
  const map = useMap();

  useEffect(() => {
    if (!location) {
      return;
    }

    map.flyTo(location, 14, {
      duration: 1.2,
    });
  }, [location, map]);

  return null;
}

// ---------------------------------------------------------
// Donation marker
// ---------------------------------------------------------
function DonationMarker({
  donation,
  currentUserId,
  onClaim,
}) {
  const [claiming, setClaiming] =
    useState(false);

  const isOwnDonation =
    Boolean(
      currentUserId &&
        donation.publisher_id ===
          currentUserId
    );

  const publisher =
    donation.publisher_profile || null;

  const publisherName =
    publisher?.full_name ||
    "Registered Food Donor";

  const organization =
    publisher?.organization_name || "";

  const phone =
    publisher?.phone || "";

  // -------------------------------------------------------
  // Claim
  // -------------------------------------------------------
  const claimResource = async () => {
    if (isOwnDonation) {
      toast.error(
        "You cannot claim food that you published."
      );

      return;
    }

    if (claiming) {
      return;
    }

    setClaiming(true);

    try {
      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error(
          "Please sign in before claiming food."
        );

        return;
      }

      // Extra frontend safety check
      if (
        donation.publisher_id ===
        user.id
      ) {
        toast.error(
          "You cannot claim your own donation."
        );

        return;
      }

      // Server-side atomic claim
      const {
        data,
        error,
      } = await supabase.rpc(
        "claim_donation",
        {
          p_donation_id:
            donation.id,
        }
      );

      if (error) {
        console.error(
          "Claim failed:",
          error
        );

        const message =
          error.message || "";

        if (
          message.includes(
            "OWN_DONATION"
          )
        ) {
          toast.error(
            "You cannot claim your own donation."
          );

          return;
        }

        if (
          message.includes(
            "ALREADY_CLAIMED"
          )
        ) {
          toast.info(
            "This food has already been claimed by someone else."
          );

          onClaim?.(donation.id);

          return;
        }

        if (
          message.includes(
            "AUTH_REQUIRED"
          )
        ) {
          toast.error(
            "Please sign in before claiming food."
          );

          return;
        }

        toast.error(
          "Could not claim this food. Please try again."
        );

        return;
      }

      console.log(
        "Donation claimed:",
        data
      );

      toast.success(
        "Food claimed successfully!",
        {
          description:
            "You can now coordinate pickup with the publisher.",
        }
      );

      // Remove from map immediately
      onClaim?.(donation.id);
    } catch (error) {
      console.error(
        "Unexpected claim error:",
        error
      );

      toast.error(
        error?.message ||
          "Something went wrong while claiming."
      );
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Marker
      position={[
        Number(donation.lat),
        Number(donation.lng),
      ]}
      icon={donationIcon}
    >
      <Popup>
        <div className="min-w-[270px] p-1">
          {/* Food */}
          <div className="mb-4 flex items-start gap-3">
            <div className="rounded-lg bg-emerald-50 p-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                {donation.food_type}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {donation.quantity}
              </p>
            </div>
          </div>

          {/* Publisher */}
          <div className="mb-4 rounded-xl border bg-gray-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Published by
            </p>

            <div className="flex items-start gap-2">
              <UserRound className="mt-0.5 h-4 w-4 text-emerald-600" />

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {publisherName}
                </p>

                {organization && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <Building2 className="h-3 w-3" />
                    {organization}
                  </div>
                )}

                {phone && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <Phone className="h-3 w-3" />
                    {phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Own resource */}
          {isOwnDonation ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-800">
                Your resource
              </p>

              <p className="mt-1 text-xs text-amber-700">
                You cannot claim the food resource
                that you published.
              </p>

              <Button
                disabled
                className="mt-3 w-full"
                size="sm"
                variant="secondary"
              >
                Your Resource
              </Button>
            </div>
          ) : (
            <Button
              onClick={claimResource}
              disabled={claiming}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              size="sm"
            >
              {claiming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Claim Food
                </>
              )}
            </Button>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

// ---------------------------------------------------------
// Main map
// ---------------------------------------------------------
export default function DonationMap({
  donations = [],
  loading = false,
  currentUserId,
  onClaim,
}) {
  const [
    userLocation,
    setUserLocation,
  ] = useState(null);

  const [
    detectedUserId,
    setDetectedUserId,
  ] = useState(null);

  // If App does not pass currentUserId,
  // get it here.
  useEffect(() => {
    if (currentUserId) {
      setDetectedUserId(
        currentUserId
      );

      return;
    }

    let mounted = true;

    const getUser = async () => {
      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (mounted) {
        setDetectedUserId(
          user?.id || null
        );
      }
    };

    getUser();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (mounted) {
            setDetectedUserId(
              session?.user?.id || null
            );
          }
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [currentUserId]);

  const activeUserId =
    currentUserId || detectedUserId;

  // -------------------------------------------------------
  // Location
  // -------------------------------------------------------
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error(
        "Geolocation is not supported by your browser."
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([
          position.coords.latitude,
          position.coords.longitude,
        ]);

        toast.success(
          "Map centered on your location."
        );
      },
      () => {
        toast.error(
          "Location access was denied or unavailable."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-xl">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className="z-0 h-full w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationController
          location={userLocation}
        />

        {donations
          .filter(
            (donation) =>
              donation.lat !== null &&
              donation.lng !== null
          )
          .map((donation) => (
            <DonationMarker
              key={donation.id}
              donation={donation}
              currentUserId={
                activeUserId
              }
              onClaim={onClaim}
            />
          ))}
      </MapContainer>

      {/* Location */}
      <Button
        onClick={getUserLocation}
        size="icon"
        variant="secondary"
        className="absolute right-4 top-4 z-[1000] h-11 w-11 rounded-full bg-white shadow-lg hover:bg-gray-50"
        title="Use my location"
      >
        <Navigation className="h-5 w-5 text-emerald-600" />
      </Button>

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 z-[900] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />

            <span className="text-sm font-medium text-gray-700">
              Loading live resources...
            </span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading &&
        donations.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-5 z-[900] flex justify-center px-4">
            <div className="rounded-xl border bg-white/95 px-5 py-3 text-center shadow-lg backdrop-blur">
              <p className="text-sm font-semibold text-gray-900">
                No available food nearby
              </p>

              <p className="mt-1 text-xs text-gray-500">
                New food resources will appear
                here automatically.
              </p>
            </div>
          </div>
        )}
    </div>
  );
}