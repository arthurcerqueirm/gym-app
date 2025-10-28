import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { Flame, Trophy } from "lucide-react";

interface CalendarDay {
  date: string;
  hasWorkout: boolean;
}

export default function Calendar() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [stats, setStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalWorkouts: 0,
  });
  const [userName, setUserName] = useState("Usuário");

  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        setUserName(session.user.user_metadata?.name || "Usuário");

        // Get all workouts for the year
        const currentYear = new Date().getFullYear();
        const { data: workouts } = await supabase
          .from("workouts")
          .select("date, completed")
          .eq("user_id", session.user.id)
          .gte("date", `${currentYear}-01-01`)
          .lte("date", `${currentYear}-12-31`)
          .eq("completed", true);

        // Get streak info
        const { data: streaksList } = await supabase
          .from("streaks")
          .select("*")
          .eq("user_id", session.user.id);

        const streaksData =
          streaksList && streaksList.length > 0 ? streaksList[0] : null;

        // Generate calendar days
        const workoutDates = new Set(workouts?.map((w) => w.date) || []);
        const calendarDays: CalendarDay[] = [];

        for (let i = 0; i < 365; i++) {
          const date = new Date(currentYear, 0, 1 + i);
          const dateStr = date.toISOString().split("T")[0];
          calendarDays.push({
            date: dateStr,
            hasWorkout: workoutDates.has(dateStr),
          });
        }

        setDays(calendarDays);
        setStats({
          currentStreak: streaksData?.current_streak || 0,
          longestStreak: streaksData?.longest_streak || 0,
          totalWorkouts: workouts?.length || 0,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Error loading calendar:", {
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
          alert(`Erro ao carregar calendário: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    };

    loadCalendarData();
  }, [navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Carregando calendário...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userName={userName}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold opacity-90">Streak Atual</p>
                <p className="text-4xl font-bold mt-2">{stats.currentStreak}</p>
                <p className="text-xs opacity-75 mt-1">dias seguidos</p>
              </div>
              <Flame size={40} className="opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold opacity-90">
                  Melhor Streak
                </p>
                <p className="text-4xl font-bold mt-2">{stats.longestStreak}</p>
                <p className="text-xs opacity-75 mt-1">até agora</p>
              </div>
              <Trophy size={40} className="opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white rounded-2xl p-6 shadow-lg">
            <div>
              <p className="text-sm font-semibold opacity-90">Dias Treinados</p>
              <p className="text-4xl font-bold mt-2">{stats.totalWorkouts}</p>
              <p className="text-xs opacity-75 mt-1">/365 no ano</p>
            </div>
          </div>
        </div>

        {/* Calendar Heatmap */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Progresso Anual
          </h2>

          <div className="flex gap-1 flex-wrap">
            {days.map((day, idx) => {
              const dayOfWeek = new Date(day.date).getDay();
              return (
                <div
                  key={day.date}
                  className={`w-3 h-3 md:w-4 md:h-4 rounded-sm cursor-pointer transition-all hover:scale-125 ${
                    day.hasWorkout
                      ? "bg-gradient-to-br from-orange-400 to-orange-600"
                      : "bg-gray-200"
                  }`}
                  title={day.date}
                />
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
              <span className="font-semibold">Legenda:</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded-sm"></div>
                <span>Sem treino</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-300 rounded-sm"></div>
                <span>1-50 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded-sm"></div>
                <span>51-200 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-600 rounded-sm"></div>
                <span>200+ dias</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
