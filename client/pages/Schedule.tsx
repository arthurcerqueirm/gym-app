import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";

interface TemplateExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  order_index: number;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: TemplateExercise[];
}

const DAYS_OF_WEEK = [
  { index: 0, name: "Segunda", label: "Seg" },
  { index: 1, name: "Terça", label: "Ter" },
  { index: 2, name: "Quarta", label: "Qua" },
  { index: 3, name: "Quinta", label: "Qui" },
  { index: 4, name: "Sexta", label: "Sex" },
  { index: 5, name: "Sábado", label: "Sab" },
  { index: 6, name: "Domingo", label: "Dom" },
];

export default function Schedule() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<{
    [key: number]: string | null;
  }>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Usuário");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [newExercise, setNewExercise] = useState({
    name: "",
    sets: 3,
    reps: 10,
    rest: 60,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        setUserId(session.user.id);
        setUserName(session.user.user_metadata?.name || "Usuário");

        // Get templates
        const { data: templatesData } = await supabase
          .from("workout_templates")
          .select("*")
          .eq("user_id", session.user.id)
          .order("name");

        const templatesWithExercises: WorkoutTemplate[] = [];

        for (const template of templatesData || []) {
          const { data: exercisesData } = await supabase
            .from("template_exercises")
            .select("*")
            .eq("template_id", template.id)
            .order("order_index");

          templatesWithExercises.push({
            id: template.id,
            name: template.name,
            description: template.description || "",
            exercises: exercisesData || [],
          });
        }

        setTemplates(templatesWithExercises);

        // Get weekly schedule
        const { data: scheduleData } = await supabase
          .from("weekly_schedule")
          .select("*")
          .eq("user_id", session.user.id);

        const schedule: { [key: number]: string | null } = {};
        DAYS_OF_WEEK.forEach((day) => {
          const scheduled = scheduleData?.find(
            (s) => s.day_of_week === day.index,
          );
          schedule[day.index] = scheduled?.template_id || null;
        });

        setWeeklySchedule(schedule);
      } catch (error) {
        console.error("Error loading schedule:", error);
        alert("Erro ao carregar programação");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleCreateTemplate = async () => {
    if (!userId || !newTemplateName.trim()) {
      alert("Nome do treino é obrigatório");
      return;
    }

    try {
      const { data: newTemplate, error } = await supabase
        .from("workout_templates")
        .insert([
          {
            user_id: userId,
            name: newTemplateName,
            description: newTemplateDesc,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setTemplates([
        ...templates,
        {
          id: newTemplate.id,
          name: newTemplate.name,
          description: newTemplate.description || "",
          exercises: [],
        },
      ]);

      setNewTemplateName("");
      setNewTemplateDesc("");
      setEditingTemplate(newTemplate.id);
    } catch (error) {
      console.error("Error creating template:", error);
      alert("Erro ao criar treino");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (
      !confirm(
        "Tem certeza? Isso vai deletar o treino e remover de todos os dias.",
      )
    ) {
      return;
    }

    try {
      // Remove from schedule
      const newSchedule = { ...weeklySchedule };
      Object.keys(newSchedule).forEach((key) => {
        if (newSchedule[parseInt(key)] === templateId) {
          newSchedule[parseInt(key)] = null;
        }
      });

      // Delete template (exercises will cascade delete)
      await supabase.from("workout_templates").delete().eq("id", templateId);

      setTemplates(templates.filter((t) => t.id !== templateId));

      // Update schedule
      for (const [day, template] of Object.entries(newSchedule)) {
        await updateWeeklySchedule(parseInt(day), template);
      }

      setWeeklySchedule(newSchedule);
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Erro ao deletar treino");
    }
  };

  const handleAddExercise = async (templateId: string) => {
    if (!newExercise.name.trim()) {
      alert("Nome do exercício é obrigatório");
      return;
    }

    try {
      const template = templates.find((t) => t.id === templateId);
      const orderIndex = (template?.exercises.length || 0) + 1;

      const { error } = await supabase.from("template_exercises").insert([
        {
          template_id: templateId,
          name: newExercise.name,
          sets: newExercise.sets,
          reps: newExercise.reps,
          rest_seconds: newExercise.rest,
          order_index: orderIndex,
        },
      ]);

      if (error) throw error;

      // Reload templates
      const { data: updatedTemplate } = await supabase
        .from("template_exercises")
        .select("*")
        .eq("template_id", templateId)
        .order("order_index");

      setTemplates(
        templates.map((t) =>
          t.id === templateId
            ? {
                ...t,
                exercises: updatedTemplate || [],
              }
            : t,
        ),
      );

      setNewExercise({ name: "", sets: 3, reps: 10, rest: 60 });
    } catch (error) {
      console.error("Error adding exercise:", error);
      alert("Erro ao adicionar exercício");
    }
  };

  const handleDeleteExercise = async (
    exerciseId: string,
    templateId: string,
  ) => {
    try {
      await supabase.from("template_exercises").delete().eq("id", exerciseId);

      setTemplates(
        templates.map((t) =>
          t.id === templateId
            ? {
                ...t,
                exercises: t.exercises.filter((e) => e.id !== exerciseId),
              }
            : t,
        ),
      );
    } catch (error) {
      console.error("Error deleting exercise:", error);
      alert("Erro ao deletar exercício");
    }
  };

  const updateWeeklySchedule = async (
    dayOfWeek: number,
    templateId: string | null,
  ) => {
    if (!userId) return;

    try {
      const { data: existing } = await supabase
        .from("weekly_schedule")
        .select("id")
        .eq("user_id", userId)
        .eq("day_of_week", dayOfWeek);

      if (templateId) {
        if (existing && existing.length > 0) {
          await supabase
            .from("weekly_schedule")
            .update({ template_id: templateId })
            .eq("user_id", userId)
            .eq("day_of_week", dayOfWeek);
        } else {
          await supabase.from("weekly_schedule").insert([
            {
              user_id: userId,
              day_of_week: dayOfWeek,
              template_id: templateId,
            },
          ]);
        }
      } else {
        if (existing && existing.length > 0) {
          await supabase
            .from("weekly_schedule")
            .delete()
            .eq("user_id", userId)
            .eq("day_of_week", dayOfWeek);
        }
      }

      const newSchedule = { ...weeklySchedule };
      newSchedule[dayOfWeek] = templateId;
      setWeeklySchedule(newSchedule);
    } catch (error) {
      console.error("Error updating schedule:", error);
      alert("Erro ao atualizar agendamento");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Carregando programação...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userName={userName}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-3xl p-8 mb-8 shadow-lg">
          <h1 className="text-3xl md:text-4xl font-bold">
            Programação de Treino
          </h1>
          <p className="text-white/90 mt-2">
            Crie templates e agende seu programa semanal
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Templates */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Template */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Criar Novo Treino
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nome (ex: Treino A)
                  </label>
                  <Input
                    placeholder="Treino A"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full h-10 rounded-lg border-2 border-gray-200 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <Input
                    placeholder="Ex: Peito e Costas"
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    className="w-full h-10 rounded-lg border-2 border-gray-200 px-3"
                  />
                </div>
                <Button
                  onClick={handleCreateTemplate}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  <Plus size={20} /> Criar Treino
                </Button>
              </div>
            </div>

            {/* Templates List */}
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {template.description}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
                      title="Deletar"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>

                  {/* Exercises */}
                  <div className="space-y-2 mb-4">
                    {template.exercises.length === 0 ? (
                      <p className="text-gray-500 text-sm italic">
                        Nenhum exercício adicionado
                      </p>
                    ) : (
                      template.exercises.map((exercise, idx) => (
                        <div
                          key={exercise.id}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                        >
                          <div>
                            <p className="font-semibold text-gray-800">
                              {exercise.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {exercise.sets}x{exercise.reps} •{" "}
                              {exercise.rest_seconds}s
                            </p>
                          </div>
                          <Button
                            onClick={() =>
                              handleDeleteExercise(exercise.id, template.id)
                            }
                            className="bg-red-100 hover:bg-red-200 text-red-600 p-1 rounded"
                            title="Deletar exercício"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Exercise Form */}
                  {editingTemplate === template.id && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 border-2 border-indigo-200">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Nome do exercício"
                          value={newExercise.name}
                          onChange={(e) =>
                            setNewExercise({
                              ...newExercise,
                              name: e.target.value,
                            })
                          }
                          className="h-9 rounded-lg border-2 border-gray-200 px-2 text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="Séries"
                          value={newExercise.sets}
                          onChange={(e) =>
                            setNewExercise({
                              ...newExercise,
                              sets: parseInt(e.target.value) || 3,
                            })
                          }
                          className="h-9 rounded-lg border-2 border-gray-200 px-2 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Reps"
                          value={newExercise.reps}
                          onChange={(e) =>
                            setNewExercise({
                              ...newExercise,
                              reps: parseInt(e.target.value) || 10,
                            })
                          }
                          className="h-9 rounded-lg border-2 border-gray-200 px-2 text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="Rest (seg)"
                          value={newExercise.rest}
                          onChange={(e) =>
                            setNewExercise({
                              ...newExercise,
                              rest: parseInt(e.target.value) || 60,
                            })
                          }
                          className="h-9 rounded-lg border-2 border-gray-200 px-2 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAddExercise(template.id)}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg text-sm"
                        >
                          Adicionar
                        </Button>
                        <Button
                          onClick={() => setEditingTemplate(null)}
                          className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 rounded-lg text-sm"
                        >
                          Fechar
                        </Button>
                      </div>
                    </div>
                  )}

                  {editingTemplate !== template.id && (
                    <Button
                      onClick={() => setEditingTemplate(template.id)}
                      className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-600 font-bold py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus size={16} /> Adicionar Exercício
                    </Button>
                  )}
                </div>
              ))}

              {templates.length === 0 && (
                <div className="bg-gray-50 rounded-2xl p-8 text-center">
                  <p className="text-gray-600">Nenhum treino criado ainda</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Weekly Schedule */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Semana</h2>

              <div className="space-y-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.index} className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">
                      {day.name}
                    </label>
                    <select
                      value={weeklySchedule[day.index] || ""}
                      onChange={(e) =>
                        updateWeeklySchedule(day.index, e.target.value || null)
                      }
                      className="w-full h-10 rounded-lg border-2 border-gray-200 px-3 bg-white cursor-pointer focus:border-indigo-500 font-medium text-sm"
                    >
                      <option value="">— Descanso —</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t-2 border-gray-200 bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-blue-900 font-semibold">💡 Dica</p>
                <p className="text-xs text-blue-700 mt-1">
                  Selecione um treino para cada dia da semana. O programa vai se
                  repetir automaticamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
