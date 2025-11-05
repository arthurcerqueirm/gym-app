import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X } from "lucide-react";

interface TemplateExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  order_index: number;
  initial_weight: number;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: TemplateExercise[];
}

const DAYS_OF_WEEK = [
  { index: 0, name: "Segunda" },
  { index: 1, name: "Terça" },
  { index: 2, name: "Quarta" },
  { index: 3, name: "Quinta" },
  { index: 4, name: "Sexta" },
  { index: 5, name: "Sábado" },
  { index: 6, name: "Domingo" },
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
    initial_weight: "" as string,
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
    } catch (error) {
      console.error("Error creating template:", error);
      alert("Erro ao criar treino");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Tem certeza que deseja deletar este treino?")) return;

    try {
      await supabase.from("workout_templates").delete().eq("id", templateId);
      setTemplates(templates.filter((t) => t.id !== templateId));

      // Remove from schedule
      const newSchedule = { ...weeklySchedule };
      Object.keys(newSchedule).forEach((key) => {
        if (newSchedule[parseInt(key)] === templateId) {
          newSchedule[parseInt(key)] = null;
        }
      });
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

    const weight = parseFloat(newExercise.initial_weight);
    if (isNaN(weight)) {
      alert("Peso é obrigatório");
      return;
    }

    try {
      const template = templates.find((t) => t.id === templateId);
      if (!template) return;

      const orderIndex = template.exercises.length;

      const { error } = await supabase.from("template_exercises").insert([
        {
          template_id: templateId,
          name: newExercise.name,
          sets: newExercise.sets,
          reps: newExercise.reps,
          initial_weight: weight,
          order_index: orderIndex,
        },
      ]);

      if (error) throw error;

      const { data: updatedTemplate } = await supabase
        .from("template_exercises")
        .select("*")
        .eq("template_id", templateId)
        .order("order_index");

      const updatedTemplates = templates.map((t) =>
        t.id === templateId ? { ...t, exercises: updatedTemplate || [] } : t,
      );

      setTemplates(updatedTemplates);
      setNewExercise({ name: "", sets: 3, reps: 10, initial_weight: "" });
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

      const { data: updatedExercises } = await supabase
        .from("template_exercises")
        .select("*")
        .eq("template_id", templateId)
        .order("order_index");

      const updatedTemplates = templates.map((t) =>
        t.id === templateId ? { ...t, exercises: updatedExercises || [] } : t,
      );

      setTemplates(updatedTemplates);
    } catch (error) {
      console.error("Error deleting exercise:", error);
      alert("Erro ao deletar exercício");
    }
  };

  const handleScheduleDay = async (
    dayIndex: number,
    templateId: string | null,
  ) => {
    if (!userId) return;

    try {
      const newSchedule = { ...weeklySchedule };
      newSchedule[dayIndex] = templateId;
      setWeeklySchedule(newSchedule);

      if (templateId) {
        const { data: existing } = await supabase
          .from("weekly_schedule")
          .select("id")
          .eq("user_id", userId)
          .eq("day_of_week", dayIndex);

        if (existing && existing.length > 0) {
          await supabase
            .from("weekly_schedule")
            .update({ template_id: templateId })
            .eq("user_id", userId)
            .eq("day_of_week", dayIndex);
        } else {
          await supabase.from("weekly_schedule").insert([
            {
              user_id: userId,
              day_of_week: dayIndex,
              template_id: templateId,
            },
          ]);
        }
      } else {
        await supabase
          .from("weekly_schedule")
          .delete()
          .eq("user_id", userId)
          .eq("day_of_week", dayIndex);
      }
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
      <div className="p-4 md:p-8 max-w-7xl mx-auto bg-background min-h-screen">
        {/* Header */}
        <div className="bg-primary text-primary-foreground rounded-3xl p-8 mb-8 shadow-lg">
          <h1 className="text-3xl md:text-4xl font-bold">
            Programação de Treino
          </h1>
          <p className="text-primary-foreground/90 mt-2">
            Crie seus treinos e organize a semana
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Create & Manage Templates */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Template Card */}
            <div className="bg-card text-card-foreground rounded-2xl shadow-lg p-6 border border-border">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Plus size={24} className="text-primary" />
                Criar Novo Treino
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Nome do Treino (ex: Treino A)
                  </label>
                  <Input
                    placeholder="Treino A"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full h-11 rounded-lg border-2 border-border bg-input text-foreground placeholder-muted-foreground px-3 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Descrição (opcional)
                  </label>
                  <Input
                    placeholder="Ex: Peito e Costas"
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    className="w-full h-11 rounded-lg border-2 border-border bg-input text-foreground placeholder-muted-foreground px-3 text-base"
                  />
                </div>
                <Button
                  onClick={handleCreateTemplate}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg flex items-center justify-center gap-2 text-base"
                >
                  <Plus size={20} /> Criar Treino
                </Button>
              </div>
            </div>

            {/* Templates List */}
            <div className="space-y-4">
              {templates.length === 0 ? (
                <div className="bg-muted rounded-2xl p-8 text-center border-2 border-dashed border-border">
                  <p className="text-muted-foreground text-lg">
                    Nenhum treino criado ainda.
                    <br />
                    <span className="text-sm">
                      Crie um novo treino para começar
                    </span>
                  </p>
                </div>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-card text-card-foreground rounded-2xl shadow-lg p-6 border-2 border-border hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">
                          {template.name}
                        </h3>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
                        title="Deletar treino"
                      >
                        <Trash2 size={20} />
                      </Button>
                    </div>

                    {/* Exercises List */}
                    <div className="space-y-2 mb-4">
                      {template.exercises.length === 0 ? (
                        <p className="text-muted-foreground text-sm italic p-3 bg-muted rounded-lg">
                          Nenhum exercício adicionado
                        </p>
                      ) : (
                        template.exercises.map((exercise) => (
                          <div
                            key={exercise.id}
                            className="flex items-center justify-between bg-muted p-4 rounded-lg border-l-4 border-primary"
                          >
                            <div className="flex-1">
                              <p className="font-bold text-foreground">
                                {exercise.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {exercise.sets}x{exercise.reps} •{" "}
                                {exercise.initial_weight}kg
                              </p>
                            </div>
                            <Button
                              onClick={() =>
                                handleDeleteExercise(exercise.id, template.id)
                              }
                              className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded ml-2"
                              title="Deletar exercício"
                            >
                              <X size={18} />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Exercise Form */}
                    {editingTemplate === template.id ? (
                      <div className="bg-muted p-4 rounded-lg space-y-3 border-2 border-primary/30">
                        <Input
                          placeholder="Nome do exercício"
                          value={newExercise.name}
                          onChange={(e) =>
                            setNewExercise({
                              ...newExercise,
                              name: e.target.value,
                            })
                          }
                          className="w-full h-10 rounded-lg border-2 border-border bg-input text-foreground placeholder-muted-foreground px-3 text-sm"
                        />
                        <div className="grid grid-cols-3 gap-2">
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
                            className="h-10 rounded-lg border-2 border-border bg-input text-foreground placeholder-muted-foreground px-2 text-sm"
                          />
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
                            className="h-10 rounded-lg border-2 border-border bg-input text-foreground placeholder-muted-foreground px-2 text-sm"
                          />
                          <Input
                            type="number"
                            placeholder="Peso (kg) *"
                            required
                            value={newExercise.initial_weight}
                            onChange={(e) =>
                              setNewExercise({
                                ...newExercise,
                                initial_weight: e.target.value,
                              })
                            }
                            className="h-10 rounded-lg border-2 border-destructive px-2 text-sm font-semibold bg-input text-foreground placeholder-muted-foreground"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAddExercise(template.id)}
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 rounded-lg text-sm"
                          >
                            Salvar Exercício
                          </Button>
                          <Button
                            onClick={() => setEditingTemplate(null)}
                            className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground font-bold py-2 rounded-lg text-sm"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setEditingTemplate(template.id)}
                        className="w-full bg-orange-100 hover:bg-orange-200 text-orange-600 font-bold py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                      >
                        <Plus size={18} /> Adicionar Exercício
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Weekly Schedule */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 sticky top-4 border-2 border-purple-200 dark:border-purple-400">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Sua Semana
              </h2>
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => {
                  const scheduledTemplateId = weeklySchedule[day.index];
                  const scheduledTemplate = templates.find(
                    (t) => t.id === scheduledTemplateId,
                  );

                  return (
                    <div key={day.index} className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {day.name}
                      </label>
                      <select
                        value={scheduledTemplateId || ""}
                        onChange={(e) =>
                          handleScheduleDay(day.index, e.target.value || null)
                        }
                        className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-slate-600 px-3 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white font-medium focus:border-purple-500 focus:outline-none"
                      >
                        <option value="">Descanso</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                      {scheduledTemplate && (
                        <div className="text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 p-2 rounded">
                          {scheduledTemplate.exercises.length} exercícios
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-400 dark:border-blue-500">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>Dica:</strong> Selecione um treino para cada dia. O
                  programa se repete automaticamente toda semana.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
