import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await signIn(email, password);

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!data?.session) {
      setError("Falha ao fazer login");
      setLoading(false);
      return;
    }

    // Ensure user record exists in users table
    try {
      const { data: userExists, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.session.user.id);

      if (checkError) {
        console.warn("Could not check user:", checkError);
      }

      if (!userExists || userExists.length === 0) {
        // Create user record if it doesn't exist
        const { error: insertError } = await supabase.from("users").insert([
          {
            id: data.session.user.id,
            name: email.split("@")[0], // Use email prefix as default name
            email: email,
          },
        ]);

        if (insertError) {
          console.error("Could not create user record:", insertError);
          // Still navigate, home page will handle user creation retry
        }
      }
    } catch (err) {
      console.error("User creation error:", err);
      // Don't block login, home page will handle it
    }

    navigate("/");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-2">
            <span className="text-orange-500">GymStreak</span>
          </h1>
          <p className="text-gray-600 text-lg">Não quebre a corrente! 🔥</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white rounded-3xl shadow-lg p-8 space-y-6"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-xl border-2 border-gray-200 px-4 text-base focus:border-orange-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Senha
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-xl border-2 border-gray-200 px-4 text-base focus:border-orange-500 focus:outline-none"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 rounded-xl text-base transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          Não tem conta? Entre em contato com suporte para criar uma.
        </p>
      </div>
    </div>
  );
}
