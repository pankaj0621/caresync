import { useState } from "react";

import {
  CheckCircle2,
  Loader2,
  MapPin,
  Navigation,
  UserRound,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { supabase } from "@/lib/supabaseClient";
import { validateDonation } from "./donationSchema";

const initialForm = {
  food_type: "",
  quantity: "",
  lat: null,
  lng: null,
};

export default function DonationForm() {
  const [form, setForm] =
    useState(initialForm);

  const [errors, setErrors] =
    useState({});

  const [locating, setLocating] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const updateField = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  // ---------------------------------------------------------
  // Location
  // ---------------------------------------------------------
  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error(
        "Geolocation is not supported by your browser."
      );

      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {
          latitude,
          longitude,
        } = position.coords;

        setForm((current) => ({
          ...current,
          lat: latitude,
          lng: longitude,
        }));

        setErrors((current) => ({
          ...current,
          lat: undefined,
          lng: undefined,
        }));

        setLocating(false);

        toast.success(
          "Location captured successfully."
        );
      },

      (error) => {
        setLocating(false);

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          toast.error(
            "Location permission denied. Please allow location access."
          );
          return;
        }

        if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          toast.error(
            "Your current location is unavailable."
          );
          return;
        }

        toast.error(
          "Unable to access your location."
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // ---------------------------------------------------------
  // Publish donation
  // ---------------------------------------------------------
  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    // Validate form
    const validation =
      validateDonation(form);

    if (!validation.success) {
      setErrors(validation.errors);

      toast.error(
        "Please complete all required fields."
      );

      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      // Get logged-in user
      const {
        data: {
          user,
        },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error(
          "Please sign in before publishing food."
        );

        return;
      }

      // -----------------------------------------------------
      // Get profile details.
      //
      // We deliberately use select("*") here because
      // profiles.email does NOT exist in your database.
      // -----------------------------------------------------
      let profile = null;

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.warn(
          "Profile lookup failed:",
          profileError.message
        );
      }

      profile = profileData;

      const fullName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        "Registered Food Donor";

      const phone =
        profile?.phone ||
        user.user_metadata?.phone ||
        "";

      const organization =
        profile?.organization_name ||
        user.user_metadata?.organization_name ||
        "";

      // -----------------------------------------------------
      // Insert donation
      // -----------------------------------------------------
      const {
        data: donation,
        error: insertError,
      } = await supabase
        .from("donations")
        .insert({
          food_type:
            validation.data.food_type,

          quantity:
            validation.data.quantity,

          lat:
            validation.data.lat,

          lng:
            validation.data.lng,

          status: "available",

          // IMPORTANT
          publisher_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error(
          "Donation insert failed:",
          insertError
        );

        toast.error(
          insertError.message ||
            "Could not publish the donation."
        );

        return;
      }

      console.log(
        "Donation published:",
        donation
      );

      toast.success(
        "Food published successfully!",
        {
          description: `Published by ${fullName}${
            organization
              ? ` • ${organization}`
              : ""
          }`,
        }
      );

      setForm(initialForm);
    } catch (error) {
      console.error(
        "Unexpected donation error:",
        error
      );

      toast.error(
        error?.message ||
          "Something went wrong while publishing."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="h-fit border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="rounded-lg bg-emerald-50 p-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>

          Log Surplus Food
        </CardTitle>

        <CardDescription>
          Share available food with nearby
          people and distribution teams.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Publisher information */}
        <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white p-2 shadow-sm">
              <UserRound className="h-5 w-5 text-emerald-600" />
            </div>

            <div>
              <p className="font-medium text-gray-900">
                Publisher account
              </p>

              <p className="mt-1 text-xs text-gray-600">
                Your registered profile will be
                automatically linked to this food
                resource.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Food type */}
          <div className="space-y-2">
            <Label htmlFor="food_type">
              Food Type
            </Label>

            <Input
              id="food_type"
              value={form.food_type}
              onChange={(event) =>
                updateField(
                  "food_type",
                  event.target.value
                )
              }
              placeholder="e.g. Cooked meals, rice, bread"
              disabled={submitting}
            />

            {errors.food_type && (
              <p className="text-sm text-red-600">
                {errors.food_type}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity
            </Label>

            <Input
              id="quantity"
              value={form.quantity}
              onChange={(event) =>
                updateField(
                  "quantity",
                  event.target.value
                )
              }
              placeholder="e.g. Food for 50 people"
              disabled={submitting}
            />

            {errors.quantity && (
              <p className="text-sm text-red-600">
                {errors.quantity}
              </p>
            )}
          </div>

          {/* Location */}
          <div className="rounded-xl border bg-gray-50 p-4">
            <div className="mb-3 flex items-start gap-3">
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <MapPin className="h-5 w-5 text-emerald-600" />
              </div>

              <div>
                <p className="font-medium text-gray-900">
                  Pickup Location
                </p>

                <p className="text-xs text-gray-500">
                  Your coordinates are required to
                  place the resource on the map.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={getLocation}
              disabled={
                locating || submitting
              }
              className="w-full"
            >
              {locating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Detecting location...
                </>
              ) : (
                <>
                  <Navigation className="mr-2 h-4 w-4" />
                  Get My Location
                </>
              )}
            </Button>

            {form.lat !== null &&
              form.lng !== null && (
                <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  <strong>
                    Location captured
                  </strong>

                  <br />

                  {form.lat.toFixed(6)},{" "}
                  {form.lng.toFixed(6)}
                </div>
              )}

            {(errors.lat ||
              errors.lng) && (
              <p className="mt-2 text-sm text-red-600">
                Please capture your location.
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 transition-all hover:bg-emerald-700"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Publish Food Resource
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}