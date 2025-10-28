import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { ensureUserExists } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Flame, Check } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  last_weight: number | null;
  done: boolean;
  new_weight: number | null;
}

interface Workout {
  id: string;
  date: string;
  completed: boolean;
  exercises: Exercise[];
}

interface UserStats {
  treinosConcluidos: number;
  currentStreak: number;
  longestStreak: number;
}

export default function Index() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [stats, setStats] = useState<UserStats>({
    treinosConcluidos: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  const [allCompleted, setAllCompleted] = useState(false);
  const [userName, setUserName] = useState("Usuário");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const initializeWorkout = async () => {
      try {
        // Get current user
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        setUserId(session.user.id);
        setUserName(session.user.user_metadata?.name || "Usuário");

        // Ensure user exists in users table (required for foreign key constraint)
        const { success: userExists, error: userError } =
          await ensureUserExists(
            session.user.id,
            session.user.email || "",
            session.user.user_metadata?.name,
          );

        if (!userExists) {
          const errorMsg =
            userError instanceof Error ? userError.message : String(userError);
          console.error("User creation/verification failed:", userError);
          alert(
            `⚠️ Erro ao inicializar usuário: ${errorMsg}\n\nVerifique se as tabelas do Supabase foram criadas corretamente.`,
          );
          throw userError;
        }

        // Get or create today's workout
        const today = new Date().toISOString().split("T")[0];
        const dayOfWeek = new Date().getDay();
        const normalizedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday=0, Sunday=6

        let { data: workoutList, error: workoutError } = await supabase
          .from("workouts")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("date", today);

        let workoutData =
          workoutList && workoutList.length > 0 ? workoutList[0] : null;

        // Get scheduled template for today
        let exercises: Exercise[] = [];
        let templateName = "Descanso";

        const { data: scheduleList, error: scheduleError } = await supabase
          .from("weekly_schedule")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("day_of_week", normalizedDay);

        const scheduleData =
          scheduleList && scheduleList.length > 0 ? scheduleList[0] : null;

        if (scheduleData?.template_id) {
          // Get template exercises
          const { data: templateExercises, error: exercisesError } =
            await supabase
              .from("template_exercises")
              .select("*")
              .eq("template_id", scheduleData.template_id)
              .order("order_index");

          // Get template name
          const { data: template, error: templateError } = await supabase
            .from("workout_templates")
            .select("name")
            .eq("id", scheduleData.template_id)
            .single();

          if (template) {
            templateName = template.name;
          }

          if (!workoutData) {
            // Create new workout for today
            const { data: newWorkout, error: createError } = await supabase
              .from("workouts")
              .insert([
                {
                  user_id: session.user.id,
                  date: today,
                  completed: false,
                },
              ])
              .select()
              .single();

            if (createError) throw createError;
            workoutData = newWorkout;
          }

          // Get or create exercises for this workout
          const { data: existingExercises } = await supabase
            .from("exercises")
            .select("*")
            .eq("workout_id", workoutData.id);

          if (!existingExercises || existingExercises.length === 0) {
            // Create exercises from template
            const exercisesToInsert = (templateExercises || []).map(
              (templateEx, index) => ({
                workout_id: workoutData!.id,
                name: templateEx.name,
                sets: templateEx.sets,
                reps: templateEx.reps,
                last_weight: templateEx.initial_weight || null,
                done: false,
                order_index: index,
              }),
            );

            if (exercisesToInsert.length > 0) {
              const { data: insertedExercises, error: insertError } =
                await supabase
                  .from("exercises")
                  .insert(exercisesToInsert)
                  .select();

              exercises = (insertedExercises || []).map((ex) => ({
                ...ex,
                new_weight: null,
              }));
            }
          } else {
            exercises = existingExercises.map((ex) => ({
              ...ex,
              new_weight: null,
            }));
          }
        } else {
          // No template scheduled for today
          if (workoutData) {
            // Delete the workout and its exercises if no template is scheduled
            await supabase
              .from("exercises")
              .delete()
              .eq("workout_id", workoutData.id);
            await supabase.from("workouts").delete().eq("id", workoutData.id);
            workoutData = null;
          }
          exercises = [];
        }

        setWorkout(
          workoutData
            ? {
                ...workoutData,
                exercises,
              }
            : null,
        );

        // Get user stats
        const { data: streaksList } = await supabase
          .from("streaks")
          .select("*")
          .eq("user_id", session.user.id);

        const streaksData =
          streaksList && streaksList.length > 0 ? streaksList[0] : null;

        const { data: allWorkouts } = await supabase
          .from("workouts")
          .select("completed")
          .eq("user_id", session.user.id)
          .eq("completed", true);

        setStats({
          treinosConcluidos: allWorkouts?.length || 0,
          currentStreak: streaksData?.current_streak || 0,
          longestStreak: streaksData?.longest_streak || 0,
        });

        setAllCompleted(exercises.length > 0 && exercises.every((e) => e.done));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Error loading workout:", {
          message: errorMessage,
          error: error,
          details: error instanceof Error ? error.stack : "No stack trace",
        });

        // Check if it's a table doesn't exist error
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
            "⚠️ Erro de permissão.\n\nVerifique as políticas RLS do Supabase ou execute os scripts SQL do SETUP_GUIDE.md",
          );
        } else {
          alert(`Erro ao carregar treino: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeWorkout();
  }, [navigate]);

  const updateExercise = (exerciseId: string, field: string, value: any) => {
    if (!workout) return;

    const updatedExercises = workout.exercises.map((ex) =>
      ex.id === exerciseId ? { ...ex, [field]: value } : ex,
    );

    const allDone = updatedExercises.every((e) => e.done);
    setAllCompleted(allDone);

    setWorkout({
      ...workout,
      exercises: updatedExercises,
    });
  };

  const handleSaveWorkout = async () => {
    if (!workout || !userId) return;

    try {
      setSaving(true);

      // Update exercises in database
      for (const exercise of workout.exercises) {
        await supabase
          .from("exercises")
          .update({
            done: exercise.done,
            last_weight: exercise.new_weight || exercise.last_weight,
          })
          .eq("id", exercise.id);
      }

      // Update workout completion status
      const completed = workout.exercises.every((e) => e.done);
      await supabase
        .from("workouts")
        .update({ completed })
        .eq("id", workout.id);

      // Update streaks if all completed
      if (completed && userId) {
        const { data: streaksData } = await supabase
          .from("streaks")
          .select("*")
          .eq("user_id", userId)
          .single();

        const today = new Date().toISOString().split("T")[0];
        const lastWorkoutDate = streaksData?.last_workout_date;

        // Only increment streak if workout hasn't been completed today
        let newStreak = streaksData?.current_streak || 0;
        let shouldIncrement = false;

        if (lastWorkoutDate !== today) {
          newStreak += 1;
          shouldIncrement = true;
        }

        const longestStreak = Math.max(
          newStreak,
          streaksData?.longest_streak || 0,
        );

        await supabase.from("streaks").upsert(
          {
            user_id: userId,
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_workout_date: today,
          },
          { onConflict: "user_id" },
        );

        setStats({
          ...stats,
          currentStreak: newStreak,
          longestStreak,
          treinosConcluidos:
            stats.treinosConcluidos + (shouldIncrement ? 1 : 0),
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error saving workout:", errorMessage, error);
      alert(`Erro ao salvar treino: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Flame
              className="mx-auto mb-4 text-accent animate-bounce"
              size={48}
            />
            <p className="text-gray-600">Carregando seu treino...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userName={userName}>
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 text-white rounded-3xl p-6 md:p-8 mb-8 shadow-lg shadow-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl md:text-4xl font-bold">Treino do Dia</h1>
            <Flame size={32} className="animate-bounce" />
          </div>
          <p className="text-lg md:text-xl font-semibold mb-2">
            🔥 Dia {stats.treinosConcluidos}/365 — Não quebre a corrente!
          </p>
          <p className="text-white/90 text-sm md:text-base">
            Streak atual: {stats.currentStreak} dias 🏆 Melhor:{" "}
            {stats.longestStreak} dias
          </p>
        </div>

        {/* Exercises List */}
        {workout && workout.exercises.length > 0 ? (
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                Exercícios do Dia
              </h2>
              <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-semibold border border-purple-500/40">
                {workout.exercises.filter((e) => e.done).length}/
                {workout.exercises.length} feitos
              </div>
            </div>
            {workout.exercises.map((exercise) => (
              <div
                key={exercise.id}
                className={`rounded-2xl p-5 shadow-md border-2 transition-all ${
                  exercise.done
                    ? "bg-emerald-950 border-emerald-500 bg-gradient-to-br from-emerald-950 to-emerald-900"
                    : "bg-card border-purple-500/30 hover:border-purple-500/60"
                }`}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={exercise.done}
                    onCheckedChange={(checked) =>
                      updateExercise(exercise.id, "done", checked)
                    }
                    className="mt-1 w-6 h-6 cursor-pointer"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-lg mb-2 flex items-center gap-2">
                      {exercise.name}
                      {exercise.done && (
                        <Check size={20} className="text-green-600" />
                      )}
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <label className="text-muted-foreground font-semibold block mb-1">
                          Séries
                        </label>
                        <p className="text-foreground font-bold text-lg">
                          {exercise.sets}
                        </p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <label className="text-muted-foreground font-semibold block mb-1">
                          Reps
                        </label>
                        <p className="text-foreground font-bold text-lg">
                          {exercise.reps}
                        </p>
                      </div>
                      <div className="bg-secondary/10 rounded-lg p-3">
                        <label className="text-secondary font-semibold block mb-1">
                          Anterior
                        </label>
                        <p className="text-secondary font-bold text-lg">
                          {exercise.last_weight
                            ? `${exercise.last_weight}kg`
                            : "—"}
                        </p>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-3">
                        <label className="text-primary font-semibold block mb-1">
                          Progresso
                        </label>
                        <p className="text-primary font-bold text-lg">
                          {exercise.new_weight && exercise.last_weight
                            ? `${(exercise.new_weight - exercise.last_weight).toFixed(1)}kg`
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="text-gray-600 font-semibold text-sm block mb-2">
                        Nova carga (kg)
                      </label>
                      <Input
                        type="number"
                        placeholder={
                          exercise.last_weight
                            ? `Última: ${exercise.last_weight}kg`
                            : "Insira o peso"
                        }
                        value={exercise.new_weight || ""}
                        onChange={(e) =>
                          updateExercise(
                            exercise.id,
                            "new_weight",
                            e.target.value ? parseFloat(e.target.value) : null,
                          )
                        }
                        className="w-full h-10 rounded-lg border-2 border-gray-200 px-3 text-sm focus:border-orange-500"
                        disabled={!exercise.done}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-8 text-center mb-8">
            <p className="text-gray-600 mb-4">
              Nenhum exercício agendado para hoje. Acesse "Programação" para
              configurar seus treinos.
            </p>
          </div>
        )}

        {/* Completion Feedback */}
        {allCompleted && workout && workout.exercises.length > 0 && (
          <div className="bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-2xl p-6 mb-8 shadow-lg animate-pulse">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">
                Parabéns {userName}! 🎉
              </h3>
              <p className="text-lg font-semibold">
                +1 no streak{" "}
                <Flame className="inline animate-bounce" size={20} />
              </p>
            </div>
          </div>
        )}

        {/* Finalize Button */}
        <Button
          onClick={handleSaveWorkout}
          disabled={saving || !workout}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 rounded-xl text-base mb-8 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {saving ? "Finalizando..." : "Finalizar treino"}
        </Button>
      </div>
    </Layout>
  );
}
