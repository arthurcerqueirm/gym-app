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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-2">
            <span className="text-primary">GymStreak</span>
          </h1>
          <p className="text-foreground text-lg">
            Seu parceiro diário de treino 💪
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-card rounded-3xl shadow-lg p-8 space-y-6"
        >
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Email
            </label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-xl border-2 border-border px-4 text-base focus:border-primary focus:outline-none bg-input text-foreground placeholder-muted-foreground"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Senha
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-xl border-2 border-border px-4 text-base focus:border-primary focus:outline-none bg-input text-foreground placeholder-muted-foreground"
              required
            />
          </div>

          {error && (
            <div className="bg-destructive/20 text-destructive p-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl text-base transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-foreground text-sm mt-6">
          Não tem conta? Entre em contato com suporte para criar uma.
        </p>
      </div>
    </div>
  );
}
