import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, ensureUserExists } from "@/lib/auth";
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

    // Ensure user record exists in users table (required for foreign keys)
    const { success, error: userError } = await ensureUserExists(
      data.session.user.id,
      data.session.user.email || email,
      email.split("@")[0],
    );

    if (!success) {
      console.warn("Could not create/verify user record:", userError);
      // Don't block login, home page will attempt to create the user again
    }

    navigate("/");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-2">
            <span className="text-[#FF6B35]">GymStreak</span>
          </h1>
          <p className="text-[#2C3E50] text-lg">Não quebre a corrente! 🔥</p>
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
              className="w-full h-12 rounded-xl border-2 border-[#E8EAED] px-4 text-base focus:border-[#FF6B35] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2C3E50] mb-2">
              Senha
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-xl border-2 border-[#E8EAED] px-4 text-base focus:border-[#FF6B35] focus:outline-none"
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
            className="w-full bg-[#FF6B35] hover:bg-[#E85A27] text-white font-bold py-3 rounded-xl text-base transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-[#2C3E50] text-sm mt-6">
          Não tem conta? Entre em contato com suporte para criar uma.
        </p>
      </div>
    </div>
  );
}
