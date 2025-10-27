import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Save } from 'lucide-react'

interface Measurement {
  weight: string
  muscleMass: string
  fatPercentage: string
  height: string
}

export default function Profile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [measurements, setMeasurements] = useState<Measurement>({
    weight: '',
    muscleMass: '',
    fatPercentage: '',
    height: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userName, setUserName] = useState('Usuário')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          navigate('/login')
          return
        }

        setUserId(session.user.id)
        setUserName(session.user.user_metadata?.name || 'Usuário')

        // Get latest measurements
        const { data: metricsData } = await supabase
          .from('body_metrics')
          .select('*')
          .eq('user_id', session.user.id)
          .order('date', { ascending: false })
          .limit(1)
          .single()

        if (metricsData) {
          setMeasurements({
            weight: metricsData.weight.toString(),
            muscleMass: metricsData.muscle_mass.toString(),
            fatPercentage: metricsData.fat_percentage.toString(),
            height: metricsData.height.toString(),
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Error loading profile:', {
          message: errorMessage,
          error: error,
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [navigate])

  const handleSaveMeasurements = async () => {
    setError('')
    setSuccess(false)

    if (!measurements.weight || !measurements.muscleMass || !measurements.fatPercentage || !measurements.height) {
      setError('Por favor, preencha todos os campos')
      return
    }

    if (!userId) return

    try {
      setSaving(true)

      const today = new Date().toISOString().split('T')[0]

      const { error: insertError } = await supabase.from('body_metrics').insert([
        {
          user_id: userId,
          date: today,
          weight: parseFloat(measurements.weight),
          muscle_mass: parseFloat(measurements.muscleMass),
          fat_percentage: parseFloat(measurements.fatPercentage),
          height: parseFloat(measurements.height),
        },
      ])

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving measurements:', err)
      setError('Erro ao salvar as medições. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userName={userName}>
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl p-8 mb-8 shadow-lg">
          <div className="flex items-center gap-4">
            <User size={40} />
            <div>
              <h1 className="text-3xl font-bold">{userName}</h1>
              <p className="text-white/90">Registre suas medições mensais</p>
            </div>
          </div>
        </div>

        {/* Measurements Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Medições Corporais</h2>

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
                className="w-full h-12 rounded-lg border-2 border-gray-200 px-4 text-base focus:border-purple-500"
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
                  setMeasurements({ ...measurements, muscleMass: e.target.value })
                }
                className="w-full h-12 rounded-lg border-2 border-gray-200 px-4 text-base focus:border-purple-500"
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
                  setMeasurements({ ...measurements, fatPercentage: e.target.value })
                }
                className="w-full h-12 rounded-lg border-2 border-gray-200 px-4 text-base focus:border-purple-500"
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
                className="w-full h-12 rounded-lg border-2 border-gray-200 px-4 text-base focus:border-purple-500"
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
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-lg text-base flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Salvando...' : 'Salvar Medições'}
          </Button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6 text-blue-900">
          <p className="font-semibold mb-2">💡 Dica</p>
          <p className="text-sm">
            Recomendamos registrar suas medições mensalmente no mesmo dia e horário para obter resultados mais precisos na evolução.
          </p>
        </div>
      </div>
    </Layout>
  )
}
