import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface BodyMetric {
  date: string;
  weight: number;
  muscle_mass: number;
  fat_percentage: number;
}

interface ChartData {
  date: string;
  weight: number;
  muscleMass: number;
  fatPercentage: number;
}

export default function Evolution() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ChartData[]>([]);
  const [summary, setSummary] = useState({
    currentWeight: 0,
    weightChange: 0,
    currentFat: 0,
    fatChange: 0,
    currentMuscle: 0,
    muscleChange: 0,
  });
  const [userName, setUserName] = useState("Usuário");

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        setUserName(session.user.user_metadata?.name || "Usuário");

        // Get all body metrics
        const { data: metricsData } = await supabase
          .from("body_metrics")
          .select("*")
          .eq("user_id", session.user.id)
          .order("date", { ascending: true });

        if (metricsData && metricsData.length > 0) {
          const chartData = metricsData.map((m: BodyMetric) => ({
            date: new Date(m.date).toLocaleDateString("pt-BR", {
              month: "short",
              day: "numeric",
            }),
            weight: m.weight,
            muscleMass: m.muscle_mass,
            fatPercentage: m.fat_percentage,
          }));

          setMetrics(chartData);

          // Calculate summary
          const latest = metricsData[metricsData.length - 1];
          const oldest = metricsData[0];

          setSummary({
            currentWeight: latest.weight,
            weightChange: latest.weight - oldest.weight,
            currentFat: latest.fat_percentage,
            fatChange: latest.fat_percentage - oldest.fat_percentage,
            currentMuscle: latest.muscle_mass,
            muscleChange: latest.muscle_mass - oldest.muscle_mass,
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Error loading metrics:", {
          message: errorMessage,
          error: error,
        });

        if (
          errorMessage.includes("relation") ||
          errorMessage.includes("does not exist")
        ) {
          alert(
            "⚠️ Banco de dados não configurado.\n\nPor favor, execute os scripts SQL do SETUP_GUIDE.md para criar as tabelas necessárias.",
          );
        } else if (
          errorMessage.includes("permission") ||
          errorMessage.includes("policy")
        ) {
          alert(
            "⚠️ Erro de permissão.\n\nVerifique as políticas RLS do Supabase.",
          );
        } else {
          alert(`Erro ao carregar evolução: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Carregando evolução...</p>
        </div>
      </Layout>
    );
  }

  if (metrics.length === 0) {
    return (
      <Layout userName={userName}>
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          <div className="bg-warm-50 dark:bg-card rounded-2xl p-8 text-center border border-primary/20">
            <TrendingUp size={48} className="mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Nenhuma medição registrada
            </h2>
            <p className="text-gray-600 mb-4">
              Acesse a aba Perfil para registrar suas primeiras medições e
              começar a acompanhar sua evolução.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userName={userName}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-200">
            <p className="text-gray-600 font-semibold text-sm mb-2">
              Peso Atual
            </p>
            <p className="text-4xl font-bold text-gray-800">
              {summary.currentWeight}kg
            </p>
            <p
              className={`text-sm font-semibold mt-2 ${
                summary.weightChange < 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {summary.weightChange > 0 ? "+" : ""}
              {summary.weightChange.toFixed(1)}kg
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-200">
            <p className="text-gray-600 font-semibold text-sm mb-2">
              Gordura Corporal
            </p>
            <p className="text-4xl font-bold text-gray-800">
              {summary.currentFat}%
            </p>
            <p
              className={`text-sm font-semibold mt-2 ${
                summary.fatChange < 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {summary.fatChange > 0 ? "+" : ""}
              {summary.fatChange.toFixed(1)}%
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-200">
            <p className="text-gray-600 font-semibold text-sm mb-2">
              Massa Magra
            </p>
            <p className="text-4xl font-bold text-gray-800">
              {summary.currentMuscle}kg
            </p>
            <p
              className={`text-sm font-semibold mt-2 ${
                summary.muscleChange > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {summary.muscleChange > 0 ? "+" : ""}
              {summary.muscleChange.toFixed(1)}kg
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-8">
          {/* Weight Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Evolução de Peso
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#f97316"
                  dot={{ r: 5 }}
                  strokeWidth={2}
                  name="Peso (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Body Composition Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Composição Corporal
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="muscleMass"
                  stroke="#f97316"
                  dot={{ r: 4 }}
                  strokeWidth={2}
                  name="Massa Magra (kg)"
                />
                <Line
                  type="monotone"
                  dataKey="fatPercentage"
                  stroke="#ea580c"
                  dot={{ r: 4 }}
                  strokeWidth={2}
                  name="Gordura (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
}
