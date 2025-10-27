import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Flame, Check } from 'lucide-react'

interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  last_weight: number | null
  done: boolean
  new_weight: number | null
}

interface Workout {
  id: string
  date: string
  completed: boolean
  exercises: Exercise[]
}

interface UserStats {
  treinosConcluidos: number
  currentStreak: number
  longestStreak: number
}

export default function Index() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [stats, setStats] = useState<UserStats>({
    treinosConcluidos: 0,
    currentStreak: 0,
    longestStreak: 0,
  })
  const [allCompleted, setAllCompleted] = useState(false)
  const [userName, setUserName] = useState('Usuário')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const initializeWorkout = async () => {
      try {
        // Get current user
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          navigate('/login')
          return
        }

        setUserId(session.user.id)
        setUserName(session.user.user_metadata?.name || 'Usuário')

        // Get or create today's workout
        const today = new Date().toISOString().split('T')[0]

        let { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('date', today)
          .single()

        if (workoutError) {
          // Create new workout for today
          const { data: newWorkout, error: createError } = await supabase
            .from('workouts')
            .insert([
              {
                user_id: session.user.id,
                date: today,
                completed: false,
              },
            ])
            .select()
            .single()

          if (createError) throw createError
          workoutData = newWorkout
        }

        // Get exercises for this workout
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*')
          .eq('workout_id', workoutData.id)

        if (exercisesError) throw exercisesError

        const exercises: Exercise[] = (exercisesData || []).map((ex) => ({
          ...ex,
          new_weight: null,
        }))

        setWorkout({
          ...workoutData,
          exercises,
        })

        // Get user stats
        const { data: streaksData } = await supabase
          .from('streaks')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        const { data: allWorkouts } = await supabase
          .from('workouts')
          .select('completed')
          .eq('user_id', session.user.id)
          .eq('completed', true)

        setStats({
          treinosConcluidos: allWorkouts?.length || 0,
          currentStreak: streaksData?.current_streak || 0,
          longestStreak: streaksData?.longest_streak || 0,
        })

        setAllCompleted(exercises.length > 0 && exercises.every((e) => e.done))
      } catch (error) {
        console.error('Error loading workout:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeWorkout()
  }, [navigate])

  const updateExercise = (exerciseId: string, field: string, value: any) => {
    if (!workout) return

    const updatedExercises = workout.exercises.map((ex) =>
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    )

    const allDone = updatedExercises.every((e) => e.done)
    setAllCompleted(allDone)

    setWorkout({
      ...workout,
      exercises: updatedExercises,
    })
  }

  const handleSaveWorkout = async () => {
    if (!workout || !userId) return

    try {
      setSaving(true)

      // Update exercises in database
      for (const exercise of workout.exercises) {
        await supabase
          .from('exercises')
          .update({
            done: exercise.done,
            last_weight: exercise.new_weight || exercise.last_weight,
          })
          .eq('id', exercise.id)
      }

      // Update workout completion status
      const completed = workout.exercises.every((e) => e.done)
      await supabase
        .from('workouts')
        .update({ completed })
        .eq('id', workout.id)

      // Update streaks if all completed
      if (completed && userId) {
        const { data: streaksData } = await supabase
          .from('streaks')
          .select('*')
          .eq('user_id', userId)
          .single()

        const today = new Date().toISOString().split('T')[0]
        const newStreak = (streaksData?.current_streak || 0) + 1
        const longestStreak = Math.max(newStreak, streaksData?.longest_streak || 0)

        await supabase.from('streaks').upsert(
          {
            user_id: userId,
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_workout_date: today,
          },
          { onConflict: 'user_id' }
        )

        setStats({
          ...stats,
          currentStreak: newStreak,
          longestStreak,
          treinosConcluidos: stats.treinosConcluidos + 1,
        })
      }
    } catch (error) {
      console.error('Error saving workout:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Flame className="mx-auto mb-4 text-orange-500 animate-bounce" size={48} />
            <p className="text-gray-600">Carregando seu treino...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userName={userName}>
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-3xl p-6 md:p-8 mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl md:text-4xl font-bold">Treino do Dia</h1>
            <Flame size={32} className="animate-bounce" />
          </div>
          <p className="text-lg md:text-xl font-semibold mb-2">
            🔥 Dia {stats.treinosConcluidos}/365 — Não quebre a corrente!
          </p>
          <p className="text-white/90 text-sm md:text-base">
            Streak atual: {stats.currentStreak} dias 🏆 Melhor: {stats.longestStreak} dias
          </p>
        </div>

        {/* Exercises List */}
        {workout && workout.exercises.length > 0 ? (
          <div className="space-y-4 mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
              Seus exercícios
            </h2>
            {workout.exercises.map((exercise) => (
              <div
                key={exercise.id}
                className={`bg-white rounded-2xl p-5 shadow-md border-2 transition-all ${
                  exercise.done
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={exercise.done}
                    onCheckedChange={(checked) =>
                      updateExercise(exercise.id, 'done', checked)
                    }
                    className="mt-1 w-6 h-6 cursor-pointer"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2">
                      {exercise.name}
                      {exercise.done && <Check size={20} className="text-green-600" />}
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <label className="text-gray-600 font-semibold block mb-1">
                          Séries
                        </label>
                        <p className="text-gray-800 font-bold text-lg">{exercise.sets}</p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3">
                        <label className="text-gray-600 font-semibold block mb-1">
                          Reps
                        </label>
                        <p className="text-gray-800 font-bold text-lg">{exercise.reps}</p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3 col-span-2 md:col-span-1">
                        <label className="text-gray-600 font-semibold block mb-1">
                          Última carga
                        </label>
                        <p className="text-gray-800 font-bold text-lg">
                          {exercise.last_weight ? `${exercise.last_weight}kg` : '—'}
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
                            : 'Insira o peso'
                        }
                        value={exercise.new_weight || ''}
                        onChange={(e) =>
                          updateExercise(
                            exercise.id,
                            'new_weight',
                            e.target.value ? parseFloat(e.target.value) : null
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
            <p className="text-gray-600 mb-4">Nenhum exercício adicionado para hoje</p>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              Adicionar exercício
            </Button>
          </div>
        )}

        {/* Completion Feedback */}
        {allCompleted && workout && workout.exercises.length > 0 && (
          <div className="bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-2xl p-6 mb-8 shadow-lg animate-pulse">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Parabéns {userName}! 🎉</h3>
              <p className="text-lg font-semibold">
                +1 no streak <Flame className="inline animate-bounce" size={20} />
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSaveWorkout}
          disabled={saving || !workout}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 rounded-xl text-base mb-8 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar treino de hoje'}
        </Button>
      </div>
    </Layout>
  )
}
