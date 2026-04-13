import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleSession(session);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) await handleSession(session);
        else {
          setCurrentUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function handleSession(session) {
    setLoading(true);
    setError(null);

    const { data: userRow, error: dbError } = await supabase
      .from("user")
      .select("record_status, user_type, username")
      .eq("userId", session.user.id)
      .single();

    if (dbError || !userRow) {
      setError("Account setup incomplete. Please try again.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (userRow.record_status !== "ACTIVE") {
      await supabase.auth.signOut();
      setError("Your account is pending activation by a Sales Manager.");
      setLoading(false);
      return;
    }

    setCurrentUser({ ...session.user, ...userRow });
    setLoading(false);
  }

  async function signIn(email, password) {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  }

  async function signUp(firstName, lastName, username, email, password) {
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { firstName, lastName, username } },
    });
    if (error) setError(error.message);
    else setError("Account created! Wait for an admin to activate it before logging in.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, error, setError, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}