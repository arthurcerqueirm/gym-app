# Tabelas Supabase para Programa Semanal de Treino

Execute estes scripts SQL no Supabase para criar as novas tabelas:

## 1. Workout Templates (Templates de Treino A, B, C, etc.)

```sql
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_templates_user ON workout_templates(user_id);
```

## 2. Template Exercises (Exercícios de Cada Template)

```sql
CREATE TABLE template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER DEFAULT 3,
  reps INTEGER DEFAULT 10,
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_template_exercises_template ON template_exercises(template_id);
```

## 3. Weekly Schedule (Mapeamento Dia da Semana → Template)

```sql
CREATE TABLE weekly_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, day_of_week)
);

CREATE INDEX idx_schedule_user ON weekly_schedule(user_id);
```

## Dias da Semana (ISO 8601)
- 0 = Segunda (Monday)
- 1 = Terça (Tuesday)
- 2 = Quarta (Wednesday)
- 3 = Quinta (Thursday)
- 4 = Sexta (Friday)
- 5 = Sábado (Saturday)
- 6 = Domingo (Sunday)

---

**Próximo passo**: Ir para a página "Programação" e criar seus templates de treino!
