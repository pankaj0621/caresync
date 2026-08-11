import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (currentUser) => {
    if (!currentUser) {
      setProfile(null);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (error) {
        console.error("Profile loading failed:", error);
        return null;
      }

      // If profile doesn't exist, create it from signup metadata.
      if (!data) {
        const metadata = currentUser.user_metadata || {};

        const newProfile = {
          id: currentUser.id,
          full_name: metadata.full_name || "",
          phone: metadata.phone || "",
          organization: metadata.organization || "",
        };

        const { data: createdProfile, error: createError } =
          await supabase
            .from("profiles")
            .upsert(newProfile, {
              onConflict: "id",
            })
            .select("*")
            .single();

        if (createError) {
          console.error(
            "Profile creation failed:",
            createError
          );

          return null;
        }

        setProfile(createdProfile);
        return createdProfile;
      }

      setProfile(data);
      return data;
    } catch (error) {
      console.error("Profile error:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error(
            "Auth session loading failed:",
            error
          );

          if (mounted) {
            setUser(null);
            setProfile(null);
          }

          return;
        }

        const currentUser = session?.user ?? null;

        if (!mounted) return;

        setUser(currentUser);

        if (currentUser) {
          await loadProfile(currentUser);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error(
          "Auth initialization failed:",
          error
        );

        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        const currentUser = session?.user ?? null;

        setUser(currentUser);

        if (currentUser) {
          await loadProfile(currentUser);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setUser(null);
    setProfile(null);
  };

  return {
    user,
    profile,
    loading,
    isAuthenticated: Boolean(user),
    logout,
  };
}