import { createContext, useContext, useEffect, useState } from "react";
import supabase from "../services/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar admin status sin bloquear
  const checkIfAdmin = async (userId) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        console.error("Error verificando admin:", error);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(!!data);
    } catch (err) {
      console.error("Error verificando admin:", err);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // 1. Recuperar sesión inicial
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        checkIfAdmin(currentUser?.id).finally(() => setLoading(false));
      })
      .catch((err) => {
        console.error("Error obteniendo sesión inicial:", err);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      });

    // 2. Suscribirse a cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      checkIfAdmin(currentUser?.id);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };

    // Forzar verificación de admin justo después del login
    await checkIfAdmin(data.user.id);
    return { success: true, user: data.user };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error cerrando sesión:", error);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
