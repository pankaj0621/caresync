import { useState } from "react";
import {
  ArrowRight,
  Loader2,
  Lock,
  LogIn,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabaseClient";

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

import RegisterForm from "./RegisterForm";

export default function AuthForm() {
  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [registrationSuccess, setRegistrationSuccess] =
    useState(null);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.error(
        "Please enter your email and password."
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data,
        error,
      } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error("Login failed:", error);

        if (
          error.message
            ?.toLowerCase()
            .includes("email not confirmed")
        ) {
          toast.error(
            "Please verify your email before signing in."
          );
        } else {
          toast.error(error.message);
        }

        return;
      }

      if (data?.user) {
        toast.success(
          `Welcome back, ${
            data.user.user_metadata?.full_name ||
            "CareSync user"
          }!`
        );
      }
    } catch (error) {
      console.error(
        "Unexpected login error:",
        error
      );

      toast.error(
        "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegistered = (result) => {
    setRegistrationSuccess(result);

    /*
     * Always switch back to login after registration.
     */
    setMode("login");

    /*
     * Keep the email so user doesn't need to type it again.
     */
    if (result?.email) {
      setEmail(result.email);
    }

    setPassword("");
  };

  if (mode === "register") {
    return (
      <RegisterForm
        onRegistered={handleRegistered}
        onLogin={() => setMode("login")}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-md border-slate-200 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
            <LogIn className="h-6 w-6 text-emerald-600" />
          </div>

          <CardTitle className="text-2xl">
            Welcome back
          </CardTitle>

          <CardDescription>
            Sign in to publish, discover and claim
            surplus food.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* REGISTRATION SUCCESS */}
          {registrationSuccess && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-emerald-100 p-1.5">
                  <Mail className="h-4 w-4 text-emerald-600" />
                </div>

                <div>
                  <p className="font-semibold text-emerald-800">
                    Account created successfully!
                  </p>

                  {registrationSuccess.requiresEmailConfirmation ? (
                    <p className="mt-1 text-sm leading-5 text-emerald-700">
                      We have sent a verification
                      email to{" "}
                      <strong>
                        {registrationSuccess.email}
                      </strong>
                      . Please verify your email and
                      then sign in.
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-emerald-700">
                      Your account is ready. You can
                      now sign in.
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setRegistrationSuccess(null)
                }
                className="mt-3 text-xs font-semibold text-emerald-700 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >
            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="login_email">
                Email
              </Label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  id="login_email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  className="pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label htmlFor="login_password">
                Password
              </Label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  id="login_password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Minimum 6 characters"
                  className="pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            {/* LOGIN */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* REGISTER */}
          <div className="mt-5 text-center text-sm text-slate-500">
            Don't have an account?{" "}

            <button
              type="button"
              onClick={() => {
                setRegistrationSuccess(null);
                setMode("register");
              }}
              className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Register
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}