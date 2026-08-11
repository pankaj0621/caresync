import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
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


const initialForm = {
  full_name: "",
  email: "",
  phone: "",
  organization: "",
  password: "",
  confirm_password: "",
};


export default function RegisterForm({ onSuccess, onLogin }) {
  const [form, setForm] = useState(initialForm);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [errors, setErrors] = useState({});


  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
      general: "",
    }));
  };


  const validateForm = () => {
    const newErrors = {};

    const name = form.full_name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const organization = form.organization.trim();

    if (!name) {
      newErrors.full_name = "Full name is required.";
    } else if (name.length < 2) {
      newErrors.full_name =
        "Name must contain at least 2 characters.";
    }

    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Please enter a valid email.";
    }

    if (!phone) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^[+]?[0-9\s-]{10,15}$/.test(phone)) {
      newErrors.phone =
        "Please enter a valid phone number.";
    }

    if (!form.password) {
      newErrors.password = "Password is required.";
    } else if (form.password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters.";
    }

    if (!form.confirm_password) {
      newErrors.confirm_password =
        "Please confirm your password.";
    } else if (
      form.password !== form.confirm_password
    ) {
      newErrors.confirm_password =
        "Passwords do not match.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };


  const getFriendlyError = (error) => {
    if (!error) {
      return "Something went wrong. Please try again.";
    }

    const message =
      error.message ||
      error.error_description ||
      error.details ||
      "";

    const lowerMessage = message.toLowerCase();


    if (
      lowerMessage.includes("user already registered")
    ) {
      return "An account with this email already exists. Please sign in.";
    }


    if (
      lowerMessage.includes("password") &&
      lowerMessage.includes("6")
    ) {
      return "Password must contain at least 6 characters.";
    }


    if (
      lowerMessage.includes("invalid email")
    ) {
      return "Please enter a valid email address.";
    }


    if (
      lowerMessage.includes("rate limit")
    ) {
      return "Too many signup attempts. Please wait a few minutes and try again.";
    }


    if (
      lowerMessage.includes("database error") ||
      lowerMessage.includes("unexpected_failure")
    ) {
      return (
        "Account creation failed because of a database configuration problem. " +
        "Please check the Supabase database/trigger configuration."
      );
    }


    if (error.status === 500) {
      return (
        "Supabase returned a server error while creating the account. " +
        "Please check your Supabase Auth and database configuration."
      );
    }


    return message || "Unable to create your account.";
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error(
        "Please correct the highlighted fields."
      );
      return;
    }


    setLoading(true);
    setSuccess(false);
    setErrors({});


    try {
      const email = form.email.trim().toLowerCase();
      const fullName = form.full_name.trim();
      const phone = form.phone.trim();
      const organization = form.organization.trim();


      console.log("CareSync: starting signup...");


      const {
        data,
        error,
      } = await supabase.auth.signUp({
        email,
        password: form.password,

        options: {
          data: {
            full_name: fullName,
            phone,
            organization,
          },

          emailRedirectTo:
            window.location.origin,
        },
      });


      console.log("CareSync signup response:", {
        data,
        error,
      });


      if (error) {
        console.error(
          "CareSync registration failed:",
          error
        );

        setErrors({
          general: getFriendlyError(error),
        });

        toast.error(getFriendlyError(error));

        return;
      }


      if (!data?.user) {
        throw new Error(
          "Account could not be created. No user was returned."
        );
      }


      /*
       * IMPORTANT:
       *
       * Profile creation is normally handled by the
       * Supabase auth.users trigger.
       *
       * We intentionally DO NOT insert into profiles here.
       *
       * This prevents duplicate profile rows.
       */


      if (data.session) {
        setSuccessMessage(
          "Your CareSync account has been created successfully."
        );

        setSuccess(true);

        toast.success(
          "Account created successfully!"
        );

        if (onSuccess) {
          onSuccess(data.user);
        }

        setForm(initialForm);

        return;
      }


      /*
       * Email confirmation is enabled.
       *
       * Supabase returns a user but no session.
       */

      setSuccessMessage(
        `Account created successfully! Please check ${email} and verify your email address before signing in.`
      );

      setSuccess(true);

      toast.success(
        "Account created! Check your email to verify."
      );

      setForm(initialForm);

    } catch (error) {
      console.error(
        "Unexpected registration error:",
        error
      );

      const message =
        getFriendlyError(error);

      setErrors({
        general: message,
      });

      toast.error(message);

    } finally {
      setLoading(false);
    }
  };


  /*
   * SUCCESS SCREEN
   */

  if (success) {
    return (
      <Card className="w-full max-w-md border-gray-200 shadow-lg">

        <CardContent className="flex flex-col items-center px-6 py-10 text-center">

          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>


          <h2 className="text-2xl font-bold text-gray-900">
            Account created!
          </h2>


          <p className="mt-3 text-sm leading-6 text-gray-600">
            {successMessage}
          </p>


          <div className="mt-6 w-full rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-left">

            <div className="flex gap-3">

              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

              <div>

                <p className="text-sm font-semibold text-emerald-900">
                  Registration successful
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  Your CareSync account has been registered.
                  You can now continue to sign in.
                </p>

              </div>

            </div>

          </div>


          <Button
            type="button"
            onClick={() => {
              if (onLogin) {
                onLogin();
              }
            }}
            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Go to Sign In
          </Button>

        </CardContent>

      </Card>
    );
  }


  return (
    <Card className="w-full max-w-md border-gray-200 shadow-lg">

      <CardHeader className="pb-4 text-center">

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
          <UserPlus className="h-6 w-6 text-emerald-600" />
        </div>


        <CardTitle className="text-2xl">
          Create your account
        </CardTitle>


        <CardDescription>
          Join CareSync and help redistribute surplus food.
        </CardDescription>

      </CardHeader>


      <CardContent>

        {errors.general && (
          <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>

              <p className="text-sm font-semibold text-red-800">
                Registration failed
              </p>

              <p className="mt-1 text-xs leading-5 text-red-700">
                {errors.general}
              </p>

            </div>

          </div>
        )}


        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          {/* Full Name */}

          <div className="space-y-2">

            <Label htmlFor="register-full-name">
              Full Name
            </Label>

            <div className="relative">

              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <Input
                id="register-full-name"
                value={form.full_name}
                onChange={(event) =>
                  updateField(
                    "full_name",
                    event.target.value
                  )
                }
                placeholder="Pankaj Kumar"
                disabled={loading}
                className="pl-9"
              />

            </div>

            {errors.full_name && (
              <p className="text-xs text-red-600">
                {errors.full_name}
              </p>
            )}

          </div>


          {/* Email */}

          <div className="space-y-2">

            <Label htmlFor="register-email">
              Email
            </Label>

            <div className="relative">

              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <Input
                id="register-email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value
                  )
                }
                placeholder="you@example.com"
                disabled={loading}
                className="pl-9"
                autoComplete="email"
              />

            </div>

            {errors.email && (
              <p className="text-xs text-red-600">
                {errors.email}
              </p>
            )}

          </div>


          {/* Phone */}

          <div className="space-y-2">

            <Label htmlFor="register-phone">
              Phone Number
            </Label>

            <div className="relative">

              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <Input
                id="register-phone"
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  updateField(
                    "phone",
                    event.target.value
                  )
                }
                placeholder="+91 9876543210"
                disabled={loading}
                className="pl-9"
                autoComplete="tel"
              />

            </div>

            {errors.phone && (
              <p className="text-xs text-red-600">
                {errors.phone}
              </p>
            )}

          </div>


          {/* Organization */}

          <div className="space-y-2">

            <Label htmlFor="register-organization">
              Organization / Business
              <span className="ml-1 text-xs font-normal text-gray-400">
                (optional)
              </span>
            </Label>

            <div className="relative">

              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <Input
                id="register-organization"
                value={form.organization}
                onChange={(event) =>
                  updateField(
                    "organization",
                    event.target.value
                  )
                }
                placeholder="NGO / Restaurant / Organization"
                disabled={loading}
                className="pl-9"
              />

            </div>

          </div>


          {/* Password */}

          <div className="space-y-2">

            <Label htmlFor="register-password">
              Password
            </Label>

            <div className="relative">

              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <Input
                id="register-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={form.password}
                onChange={(event) =>
                  updateField(
                    "password",
                    event.target.value
                  )
                }
                placeholder="Minimum 6 characters"
                disabled={loading}
                className="px-9"
                autoComplete="new-password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>

            </div>

            {errors.password && (
              <p className="text-xs text-red-600">
                {errors.password}
              </p>
            )}

          </div>


          {/* Confirm Password */}

          <div className="space-y-2">

            <Label htmlFor="register-confirm-password">
              Confirm Password
            </Label>

            <div className="relative">

              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <Input
                id="register-confirm-password"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={form.confirm_password}
                onChange={(event) =>
                  updateField(
                    "confirm_password",
                    event.target.value
                  )
                }
                placeholder="Re-enter your password"
                disabled={loading}
                className="px-9"
                autoComplete="new-password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (current) => !current
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>

            </div>

            {errors.confirm_password && (
              <p className="text-xs text-red-600">
                {errors.confirm_password}
              </p>
            )}

          </div>


          {/* Submit */}

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700"
          >

            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </>
            )}

          </Button>

        </form>


        <div className="mt-5 text-center text-sm text-gray-500">

          Already have an account?{" "}

          <button
            type="button"
            onClick={onLogin}
            className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Sign in
          </button>

        </div>

      </CardContent>

    </Card>
  );
}