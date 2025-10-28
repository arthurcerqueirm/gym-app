import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "@/components/ThemeToggle";
import { User, Save, Edit2, Check } from "lucide-react";

interface UserProfile {
  name: string;
  gender: string;
  bio: string;
  dateOfBirth: string;
}

interface Measurement {
  weight: string;
  muscleMass: string;
  fatPercentage: string;
  height: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "",
    gender: "",
    bio: "",
    dateOfBirth: "",
  });
  const [measurements, setMeasurements] = useState<Measurement>({
    weight: "",
    muscleMass: "",
    fatPercentage: "",
    height: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        setUserId(session.user.id);

        // Get user profile
        const { data: userData } = await supabase
          .from("users")
          .select("name, gender, bio, date_of_birth")
          .eq("id", session.user.id)
          .single();

        if (userData) {
          setUserProfile({
            name: userData.name || "",
            gender: userData.gender || "",
            bio: userData.bio || "",
            dateOfBirth: userData.date_of_birth || "",
          });
        }

        // Get latest measurements
        const { data: metricsData } = await supabase
          .from("body_metrics")
          .select("*")
          .eq("user_id", session.user.id)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (metricsData) {
          setMeasurements({
            weight: metricsData.weight.toString(),
            muscleMass: metricsData.muscle_mass.toString(),
            fatPercentage: metricsData.fat_percentage.toString(),
            height: metricsData.height.toString(),
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Error loading profile:", {
          message: errorMessage,
          error: error,
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleSaveProfile = async () => {
    setError("");
    setSuccess(false);

    if (!userProfile.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    if (!userId) return;

    try {
      setSaving(true);

      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: userProfile.name,
          gender: userProfile.gender || null,
          bio: userProfile.bio || null,
          date_of_birth: userProfile.dateOfBirth || null,
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      setEditingProfile(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Error saving profile:", {
        message: errorMessage,
        error: err,
      });
      setError(`Erro ao salvar perfil: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMeasurements = async () => {
    setError("");
    setSuccess(false);

    if (
      !measurements.weight ||
      !measurements.muscleMass ||
      !measurements.fatPercentage ||
      !measurements.height
    ) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    if (!userId) return;

    try {
      setSaving(true);

      const today = new Date().toISOString().split("T")[0];

      const { error: insertError } = await supabase
        .from("body_metrics")
        .insert([
          {
            user_id: userId,
            date: today,
            weight: parseFloat(measurements.weight),
            muscle_mass: parseFloat(measurements.muscleMass),
            fat_percentage: parseFloat(measurements.fatPercentage),
            height: parseFloat(measurements.height),
          },
        ]);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Error saving measurements:", {
        message: errorMessage,
        error: err,
      });

      if (
        errorMessage.includes("relation") ||
        errorMessage.includes("does not exist")
      ) {
        setError(
          "⚠️ Banco de dados não configurado. Execute os scripts SQL do SETUP_GUIDE.md",
        );
      } else if (
        errorMessage.includes("permission") ||
        errorMessage.includes("policy")
      ) {
        setError(
          "⚠️ Erro de permissão. Verifique as políticas RLS do Supabase.",
        );
      } else {
        setError(`Erro ao salvar as medições: ${errorMessage}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userName={userProfile.name}>
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="btn-gradient text-white rounded-3xl p-8 mb-8 shadow-lg shadow-orange-500/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <User size={40} />
              <div>
                <h1 className="text-3xl font-bold">
                  {userProfile.name || "Novo Usuário"}
                </h1>
                <p className="text-white/90">Gerencie seu perfil e medições</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Profile Section */}
        <div className="card-light dark:card-dark rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Meu Perfil</h2>
            {!editingProfile && (
              <Button
                onClick={() => setEditingProfile(true)}
                className="bg-primary/10 hover:bg-primary/20 text-primary font-bold py-2 px-4 rounded-lg flex items-center gap-2"
              >
                <Edit2 size={18} /> Editar
              </Button>
            )}
          </div>

          {editingProfile ? (
            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Nome *
                </label>
                <Input
                  type="text"
                  placeholder="Seu nome completo"
                  value={userProfile.name}
                  onChange={(e) =>
                    setUserProfile({ ...userProfile, name: e.target.value })
                  }
                  className="w-full h-12 rounded-lg border-2 border-border px-4 text-base focus:border-primary bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Gênero
                </label>
                <select
                  value={userProfile.gender}
                  onChange={(e) =>
                    setUserProfile({ ...userProfile, gender: e.target.value })
                  }
                  className="w-full h-12 rounded-lg border-2 border-gray-200 px-4 text-base bg-white focus:border-orange-500"
                >
                  <option value="">Prefiro não informar</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data de Nascimento
                </label>
                <Input
                  type="date"
                  value={userProfile.dateOfBirth}
                  onChange={(e) =>
                    setUserProfile({
                      ...userProfile,
                      dateOfBirth: e.target.value,
                    })
                  }
                  className="w-full h-12 rounded-lg border-2 border-gray-200 px-4 text-base focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bio (opcional)
                </label>
                <textarea
                  placeholder="Uma breve descrição sobre você..."
                  value={userProfile.bio}
                  onChange={(e) =>
                    setUserProfile({ ...userProfile, bio: e.target.value })
                  }
                  className="w-full h-24 rounded-lg border-2 border-gray-200 px-4 py-3 text-base focus:border-orange-500 resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg text-sm font-medium">
                  ✓ Perfil atualizado com sucesso!
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 btn-gradient text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Check size={20} />
                  {saving ? "Salvando..." : "Salvar Perfil"}
                </Button>
                <Button
                  onClick={() => setEditingProfile(false)}
                  disabled={saving}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-bold py-3 rounded-lg"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-warm-50 dark:bg-card rounded-lg p-4 border border-warm">
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="text-lg font-semibold text-foreground">
                  {userProfile.name || "Não informado"}
                </p>
              </div>
              <div className="bg-warm-50 dark:bg-card rounded-lg p-4 border border-warm">
                <p className="text-sm text-muted-foreground">Gênero</p>
                <p className="text-lg font-semibold text-foreground">
                  {userProfile.gender
                    ? userProfile.gender.charAt(0).toUpperCase() +
                      userProfile.gender.slice(1)
                    : "Não informado"}
                </p>
              </div>
              <div className="bg-warm-50 dark:bg-card rounded-lg p-4 border border-warm">
                <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                <p className="text-lg font-semibold text-foreground">
                  {userProfile.dateOfBirth
                    ? new Date(userProfile.dateOfBirth).toLocaleDateString(
                        "pt-BR",
                      )
                    : "Não informada"}
                </p>
              </div>
              {userProfile.bio && (
                <div className="bg-warm-50 dark:bg-card rounded-lg p-4 border border-warm">
                  <p className="text-sm text-muted-foreground">Bio</p>
                  <p className="text-lg font-semibold text-foreground">
                    {userProfile.bio}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Measurements Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Medições Corporais
          </h2>

          <div className="space-y-5 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Peso (kg)
              </label>
              <Input
                type="number"
                placeholder="Ex: 75.5"
                step="0.1"
                value={measurements.weight}
                onChange={(e) =>
                  setMeasurements({ ...measurements, weight: e.target.value })
                }
                className="w-full h-12 rounded-lg border-2 border-gray-200 px-4 text-base focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Massa Magra (kg)
              </label>
              <Input
                type="number"
                placeholder="Ex: 60.0"
                step="0.1"
                value={measurements.muscleMass}
                onChange={(e) =>
                  setMeasurements({
                    ...measurements,
                    muscleMass: e.target.value,
                  })
                }
                className="w-full h-12 rounded-lg border-2 border-gray-200 px-4 text-base focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gordura Corporal (%)
              </label>
              <Input
                type="number"
                placeholder="Ex: 20.5"
                step="0.1"
                value={measurements.fatPercentage}
                onChange={(e) =>
                  setMeasurements({
                    ...measurements,
                    fatPercentage: e.target.value,
                  })
                }
                className="w-full h-12 rounded-lg border-2 border-gray-200 px-4 text-base focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Altura (cm)
              </label>
              <Input
                type="number"
                placeholder="Ex: 175"
                step="1"
                value={measurements.height}
                onChange={(e) =>
                  setMeasurements({ ...measurements, height: e.target.value })
                }
                className="w-full h-12 rounded-lg border-2 border-gray-200 px-4 text-base focus:border-orange-500"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 p-4 rounded-lg text-sm font-medium mb-6">
              ✓ Medições salvas com sucesso!
            </div>
          )}

          <Button
            onClick={handleSaveMeasurements}
            disabled={saving}
            className="w-full btn-gradient text-white font-bold py-3 rounded-lg text-base flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? "Salvando..." : "Salvar Medições"}
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-warm-50 dark:bg-card rounded-2xl p-6 text-foreground border-l-4 border-primary">
          <p className="font-semibold mb-2">💡 Dica</p>
          <p className="text-sm text-muted-foreground">
            Recomendamos registrar suas medições mensalmente no mesmo dia e
            horário para obter resultados mais precisos na evolução.
          </p>
        </div>
      </div>
    </Layout>
  );
}
