import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_PASSWORD = "H-ader9879";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function isAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return false;
  const token = auth.slice(7).trim();
  const { data } = await supabase.rpc("admin_validate_session", { p_token: token });
  return data === true;
}

async function logAction(action: string, recordId: string, details: Record<string, unknown>) {
  await supabase.from("admin_activity_log").insert({
    action,
    record_id: recordId,
    details,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/admin-api/, "");
    const body = req.method !== "GET" && req.method !== "DELETE" ? await req.json().catch(() => ({})) : {};

    // ─── LOGIN ───────────────────────────────────────────
    if (path === "/login" && req.method === "POST") {
      const { password } = body;
      if (password !== ADMIN_PASSWORD) {
        return json({ error: "Incorrect password. Please try again." }, 401);
      }
      const token = crypto.randomUUID() + "-" + crypto.randomUUID();
      const { error } = await supabase.from("admin_sessions").insert({
        token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      if (error) return json({ error: "Failed to create session" }, 500);
      return json({ token });
    }

    // ─── LOGOUT ──────────────────────────────────────────
    if (path === "/logout" && req.method === "POST") {
      const auth = req.headers.get("Authorization");
      if (auth?.startsWith("Bearer ")) {
        const token = auth.slice(7).trim();
        await supabase.from("admin_sessions").delete().eq("token", token);
      }
      return json({ success: true });
    }

    // ─── VALIDATE ────────────────────────────────────────
    if (path === "/validate" && req.method === "GET") {
      const valid = await isAdmin(req);
      return json({ valid });
    }

    // All remaining routes require admin auth
    if (!(await isAdmin(req))) {
      return json({ error: "Unauthorized. Admin access required." }, 403);
    }

    // ─── DASHBOARD STATS ─────────────────────────────────
    if (path === "/dashboard" && req.method === "GET") {
      const [
        students, stages, courses, subjects, quizzes,
        questions, attempts, achievements, badges, trophies,
        nameChanges, templates
      ] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("stages").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("subjects").select("id", { count: "exact", head: true }),
        supabase.from("quizzes").select("id", { count: "exact", head: true }),
        supabase.from("questions").select("id", { count: "exact", head: true }),
        supabase.from("quiz_attempts").select("id", { count: "exact", head: true }),
        supabase.from("achievements").select("id", { count: "exact", head: true }),
        supabase.from("achievements").select("id", { count: "exact", head: true }).eq("achievement_type", "badge"),
        supabase.from("achievements").select("id", { count: "exact", head: true }).eq("achievement_type", "trophy"),
        supabase.from("name_change_history").select("id", { count: "exact", head: true }),
        supabase.from("question_templates").select("id", { count: "exact", head: true }),
      ]);

      const completedRes = await supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("status", "completed");

      // Recent activity
      const recentStudents = await supabase.from("students").select("display_name, created_at").order("created_at", { ascending: false }).limit(5);
      const recentAttempts = await supabase.from("quiz_attempts").select("student_id, quiz_id, score, percentage, created_at").order("created_at", { ascending: false }).limit(5);
      const recentNameChanges = await supabase.from("name_change_history").select("previous_name, new_name, changed_at").order("changed_at", { ascending: false }).limit(5);

      return json({
        totalStudents: students.count ?? 0,
        totalStages: stages.count ?? 0,
        totalCourses: courses.count ?? 0,
        totalSubjects: subjects.count ?? 0,
        totalQuizzes: quizzes.count ?? 0,
        totalQuestions: questions.count ?? 0,
        totalAttempts: attempts.count ?? 0,
        totalCompleted: completedRes.count ?? 0,
        totalAchievements: achievements.count ?? 0,
        totalBadges: badges.count ?? 0,
        totalTrophies: trophies.count ?? 0,
        totalNameChanges: nameChanges.count ?? 0,
        totalTemplates: templates.count ?? 0,
        recentStudents: recentStudents.data ?? [],
        recentAttempts: recentAttempts.data ?? [],
        recentNameChanges: recentNameChanges.data ?? [],
      });
    }

    // ─── STAGES ──────────────────────────────────────────
    if (path === "/stages" && req.method === "GET") {
      const { data, error } = await supabase.from("stages").select("*").order("sort_order");
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }
    if (path === "/stages" && req.method === "POST") {
      const { name, description, icon_url, sort_order, is_enabled, is_visible } = body;
      const { data, error } = await supabase.from("stages").insert({ name, description: description || "", icon_url: icon_url || "", sort_order: sort_order ?? 0, is_enabled: is_enabled ?? true, is_visible: is_visible ?? true }).select().single();
      if (error) return json({ error: error.message }, 500);
      await logAction("create_stage", data.id, { name });
      return json(data);
    }
    if (path.startsWith("/stages/") && req.method === "PUT") {
      const id = path.split("/")[2];
      const { data, error } = await supabase.from("stages").update(body).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 500);
      await logAction("update_stage", id, body);
      return json(data);
    }
    if (path.startsWith("/stages/") && req.method === "DELETE") {
      const id = path.split("/")[2];
      const { error } = await supabase.from("stages").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      await logAction("delete_stage", id, {});
      return json({ success: true });
    }

    // ─── COURSES ─────────────────────────────────────────
    if (path === "/courses" && req.method === "GET") {
      const stageId = url.searchParams.get("stage_id");
      let q = supabase.from("courses").select("*").order("sort_order");
      if (stageId) q = q.eq("stage_id", stageId);
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }
    if (path === "/courses" && req.method === "POST") {
      const { data, error } = await supabase.from("courses").insert(body).select().single();
      if (error) return json({ error: error.message }, 500);
      await logAction("create_course", data.id, { name: body.name });
      return json(data);
    }
    if (path.startsWith("/courses/") && req.method === "PUT") {
      const id = path.split("/")[2];
      const { data, error } = await supabase.from("courses").update(body).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 500);
      await logAction("update_course", id, body);
      return json(data);
    }
    if (path.startsWith("/courses/") && req.method === "DELETE") {
      const id = path.split("/")[2];
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      await logAction("delete_course", id, {});
      return json({ success: true });
    }

    // ─── SUBJECTS ────────────────────────────────────────
    if (path === "/subjects" && req.method === "GET") {
      const courseId = url.searchParams.get("course_id");
      let q = supabase.from("subjects").select("*").order("sort_order");
      if (courseId) q = q.eq("course_id", courseId);
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }
    if (path === "/subjects" && req.method === "POST") {
      const { data, error } = await supabase.from("subjects").insert(body).select().single();
      if (error) return json({ error: error.message }, 500);
      await logAction("create_subject", data.id, { name: body.name });
      return json(data);
    }
    if (path.startsWith("/subjects/") && req.method === "PUT") {
      const id = path.split("/")[2];
      const { data, error } = await supabase.from("subjects").update(body).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 500);
      await logAction("update_subject", id, body);
      return json(data);
    }
    if (path.startsWith("/subjects/") && req.method === "DELETE") {
      const id = path.split("/")[2];
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      await logAction("delete_subject", id, {});
      return json({ success: true });
    }

    // ─── FOLDERS ─────────────────────────────────────────
    if (path === "/folders" && req.method === "GET") {
      const subjectId = url.searchParams.get("subject_id");
      let q = supabase.from("folders").select("*").order("sort_order");
      if (subjectId) q = q.eq("subject_id", subjectId);
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }
    if (path === "/folders" && req.method === "POST") {
      const { data, error } = await supabase.from("folders").insert(body).select().single();
      if (error) return json({ error: error.message }, 500);
      await logAction("create_folder", data.id, { name: body.name });
      return json(data);
    }
    if (path.startsWith("/folders/") && req.method === "PUT") {
      const id = path.split("/")[2];
      const { data, error } = await supabase.from("folders").update(body).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 500);
      await logAction("update_folder", id, body);
      return json(data);
    }
    if (path.startsWith("/folders/") && req.method === "DELETE") {
      const id = path.split("/")[2];
      const { error } = await supabase.from("folders").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      await logAction("delete_folder", id, {});
      return json({ success: true });
    }

    // ─── QUIZZES ─────────────────────────────────────────
    if (path === "/quizzes" && req.method === "GET") {
      const subjectId = url.searchParams.get("subject_id");
      const folderId = url.searchParams.get("folder_id");
      let q = supabase.from("quizzes").select("*").order("sort_order");
      if (subjectId) q = q.eq("subject_id", subjectId);
      if (folderId) q = q.eq("folder_id", folderId);
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }
    if (path === "/quizzes" && req.method === "POST") {
      const { data, error } = await supabase.from("quizzes").insert(body).select().single();
      if (error) return json({ error: error.message }, 500);
      await logAction("create_quiz", data.id, { name: body.name });
      return json(data);
    }
    if (path === "/quizzes/duplicate" && req.method === "POST") {
      const { quiz_id, new_name } = body;
      const { data: orig } = await supabase.from("quizzes").select("*").eq("id", quiz_id).single();
      if (!orig) return json({ error: "Quiz not found" }, 404);
      const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = orig;
      const { data: dup, error: dupErr } = await supabase.from("quizzes").insert({ ...rest, name: new_name || `${orig.name} (Copy)` }).select().single();
      if (dupErr) return json({ error: dupErr.message }, 500);
      const { data: questions } = await supabase.from("questions").select("*").eq("quiz_id", quiz_id);
      if (questions && questions.length > 0) {
        const newQs = questions.map(({ id: _qid, quiz_id: _qz, created_at: _qca, updated_at: _qua, ...qr }) => ({ ...qr, quiz_id: dup.id }));
        await supabase.from("questions").insert(newQs);
      }
      await logAction("duplicate_quiz", dup.id, { source: quiz_id });
      return json(dup);
    }
    if (path.startsWith("/quizzes/") && req.method === "PUT") {
      const id = path.split("/")[2];
      const { data, error } = await supabase.from("quizzes").update(body).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 500);
      await logAction("update_quiz", id, body);
      return json(data);
    }
    if (path.startsWith("/quizzes/") && req.method === "DELETE") {
      const id = path.split("/")[2];
      const { error } = await supabase.from("quizzes").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      await logAction("delete_quiz", id, {});
      return json({ success: true });
    }

    // ─── QUESTIONS ───────────────────────────────────────
    if (path === "/questions" && req.method === "GET") {
      const quizId = url.searchParams.get("quiz_id");
      const searchText = url.searchParams.get("search");
      let q = supabase.from("questions").select("*").order("sort_order");
      if (quizId) q = q.eq("quiz_id", quizId);
      if (searchText) q = q.ilike("question_text", `%${searchText}%`);
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }
    if (path === "/questions" && req.method === "POST") {
      const { data, error } = await supabase.from("questions").insert(body).select().single();
      if (error) return json({ error: error.message }, 500);
      await logAction("create_question", data.id, { quiz_id: body.quiz_id });
      return json(data);
    }
    if (path === "/questions/bulk" && req.method === "POST") {
      const { questions } = body;
      if (!Array.isArray(questions) || questions.length === 0) return json({ error: "No questions provided" }, 400);
      const { data, error } = await supabase.from("questions").insert(questions).select();
      if (error) return json({ error: error.message }, 500);
      await logAction("bulk_import_questions", String(data.length), { count: data.length });
      return json({ imported: data.length, data });
    }
    if (path === "/questions/duplicate" && req.method === "POST") {
      const { question_id } = body;
      const { data: orig } = await supabase.from("questions").select("*").eq("id", question_id).single();
      if (!orig) return json({ error: "Question not found" }, 404);
      const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = orig;
      const { data: dup, error } = await supabase.from("questions").insert({ ...rest, question_text: `${orig.question_text} (Copy)` }).select().single();
      if (error) return json({ error: error.message }, 500);
      return json(dup);
    }
    if (path.startsWith("/questions/") && req.method === "PUT") {
      const id = path.split("/")[2];
      const { data, error } = await supabase.from("questions").update(body).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 500);
      await logAction("update_question", id, body);
      return json(data);
    }
    if (path.startsWith("/questions/") && req.method === "DELETE") {
      const id = path.split("/")[2];
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      await logAction("delete_question", id, {});
      return json({ success: true });
    }

    // ─── QUESTION TEMPLATES ──────────────────────────────
    if (path === "/templates" && req.method === "GET") {
      const { data, error } = await supabase.from("question_templates").select("*").order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }
    if (path === "/templates" && req.method === "POST") {
      const { data, error } = await supabase.from("question_templates").insert(body).select().single();
      if (error) return json({ error: error.message }, 500);
      await logAction("create_template", data.id, { name: body.name });
      return json(data);
    }
    if (path.startsWith("/templates/") && req.method === "PUT") {
      const id = path.split("/")[2];
      const { data, error } = await supabase.from("question_templates").update(body).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 500);
      await logAction("update_template", id, body);
      return json(data);
    }
    if (path.startsWith("/templates/") && req.method === "DELETE") {
      const id = path.split("/")[2];
      const { error } = await supabase.from("question_templates").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      await logAction("delete_template", id, {});
      return json({ success: true });
    }

    // ─── ACHIEVEMENTS ────────────────────────────────────
    if (path === "/achievements" && req.method === "GET") {
      const { data, error } = await supabase.from("achievements").select("*").order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }
    if (path === "/achievements" && req.method === "POST") {
      const { data, error } = await supabase.from("achievements").insert(body).select().single();
      if (error) return json({ error: error.message }, 500);
      await logAction("create_achievement", data.id, { name: body.name });
      return json(data);
    }
    if (path.startsWith("/achievements/") && req.method === "PUT") {
      const id = path.split("/")[2];
      const { data, error } = await supabase.from("achievements").update(body).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 500);
      await logAction("update_achievement", id, body);
      return json(data);
    }
    if (path.startsWith("/achievements/") && req.method === "DELETE") {
      const id = path.split("/")[2];
      const { error } = await supabase.from("achievements").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      await logAction("delete_achievement", id, {});
      return json({ success: true });
    }

    // ─── LEADERBOARD SETTINGS ────────────────────────────
    if (path === "/leaderboard-settings" && req.method === "GET") {
      const { data, error } = await supabase.from("leaderboard_settings").select("*").eq("id", 1).single();
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }
    if (path === "/leaderboard-settings" && req.method === "PUT") {
      const { data, error } = await supabase.from("leaderboard_settings").update({
        is_enabled: body.is_enabled,
        columns_config: body.columns_config,
        sort_by: body.sort_by,
        sort_direction: body.sort_direction,
      }).eq("id", 1).select().single();
      if (error) return json({ error: error.message }, 500);
      await logAction("update_leaderboard_settings", "1", body);
      return json(data);
    }

    // ─── STUDENTS (admin view) ───────────────────────────
    if (path === "/students" && req.method === "GET") {
      const search = url.searchParams.get("search");
      let q = supabase.from("students").select("*").order("created_at", { ascending: false });
      if (search) q = q.or(`display_name.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);

      // Enrich with badge/trophy counts
      const enriched = await Promise.all((data || []).map(async (s) => {
        const { count: badgeCount } = await supabase.from("student_achievements").select("id", { count: "exact", head: true }).eq("student_id", s.id);
        const { data: achData } = await supabase.from("student_achievements").select("achievement_id").eq("student_id", s.id);
        let badges = 0, trophies = 0;
        if (achData && achData.length > 0) {
          const aIds = achData.map(a => a.achievement_id);
          const { data: aTypes } = await supabase.from("achievements").select("id, achievement_type").in("id", aIds);
          for (const a of aTypes || []) {
            if (a.achievement_type === "badge") badges++;
            else trophies++;
          }
        }
        return { ...s, badge_count: badges, trophy_count: trophies };
      }));
      return json(enriched);
    }
    if (path.startsWith("/students/") && req.method === "GET") {
      const id = path.split("/")[2];
      const { data: student, error } = await supabase.from("students").select("*").eq("id", id).single();
      if (error) return json({ error: error.message }, 500);

      const { data: attempts } = await supabase.from("quiz_attempts").select("*, quizzes(name)").eq("student_id", id).order("created_at", { ascending: false });
      const { data: studentAchs } = await supabase.from("student_achievements").select("achievement_id, awarded_at, achievements(*)").eq("student_id", id);
      const { data: nameChanges } = await supabase.from("name_change_history").select("*").eq("student_id", id).order("changed_at", { ascending: false });

      return json({ ...student, attempts: attempts || [], achievements: studentAchs || [], nameChanges: nameChanges || [] });
    }

    // ─── QUIZ ATTEMPTS (admin) ───────────────────────────
    if (path === "/attempts" && req.method === "GET") {
      const studentId = url.searchParams.get("student_id");
      const quizId = url.searchParams.get("quiz_id");
      let q = supabase.from("quiz_attempts").select("*, students(display_name), quizzes(name)").order("created_at", { ascending: false }).limit(200);
      if (studentId) q = q.eq("student_id", studentId);
      if (quizId) q = q.eq("quiz_id", quizId);
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }
    if (path.startsWith("/attempts/") && req.method === "GET") {
      const id = path.split("/")[2];
      const { data: attempt, error } = await supabase.from("quiz_attempts").select("*, students(display_name), quizzes(name)").eq("id", id).single();
      if (error) return json({ error: error.message }, 500);
      const { data: answers } = await supabase.from("attempt_answers").select("*, questions(question_text, question_translation, answer_a, answer_b, answer_c, answer_d, correct_answer, correct_answer_translation, explanation)").eq("attempt_id", id).order("sort_order");
      return json({ ...attempt, answers: answers || [] });
    }

    // ─── NAME CHANGE HISTORY ─────────────────────────────
    if (path === "/name-changes" && req.method === "GET") {
      const search = url.searchParams.get("search");
      let q = supabase.from("name_change_history").select("*, students(display_name, id)").order("changed_at", { ascending: false });
      if (search) q = q.or(`previous_name.ilike.%${search}%,new_name.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }

    // ─── REPORTS / STATISTICS ────────────────────────────
    if (path === "/reports" && req.method === "GET") {
      const { data: attempts } = await supabase.from("quiz_attempts").select("quiz_id, score, percentage, correct_answers, wrong_answers, completion_time_seconds, mode, created_at, quizzes(name)");
      const { data: students } = await supabase.from("students").select("display_name, total_points, total_completed_quizzes, highest_score, total_time_spent_seconds");

      // Most attempted quizzes
      const quizCounts: Record<string, { name: string; count: number }> = {};
      const questionWrong: Record<string, { question_text: string; wrong: number }> = {};

      for (const a of attempts || []) {
        const key = a.quiz_id;
        if (!quizCounts[key]) quizCounts[key] = { name: a.quizzes?.name || "Unknown", count: 0 };
        quizCounts[key].count++;
      }

      // Most difficult questions (wrong-answer frequency)
      const { data: wrongAnswers } = await supabase.from("attempt_answers").select("question_id, is_correct, questions(question_text)").eq("is_correct", false).limit(500);
      for (const wa of wrongAnswers || []) {
        const key = wa.question_id;
        if (!questionWrong[key]) questionWrong[key] = { question_text: wa.questions?.question_text || "", wrong: 0 };
        questionWrong[key].wrong++;
      }

      const avgScore = attempts && attempts.length > 0
        ? attempts.reduce((s, a) => s + Number(a.percentage), 0) / attempts.length : 0;
      const avgTime = attempts && attempts.length > 0
        ? attempts.reduce((s, a) => s + a.completion_time_seconds, 0) / attempts.length : 0;
      const totalPointsAwarded = students?.reduce((s, st) => s + Number(st.total_points), 0) || 0;

      const topStudents = (students || []).sort((a, b) => Number(b.total_points) - Number(a.total_points)).slice(0, 10);
      const mostAttempted = Object.entries(quizCounts).map(([id, v]) => ({ id, name: v.name, count: v.count })).sort((a, b) => b.count - a.count).slice(0, 10);
      const mostDifficult = Object.entries(questionWrong).map(([id, v]) => ({ id, question_text: v.question_text, wrong_count: v.wrong })).sort((a, b) => b.wrong_count - a.wrong_count).slice(0, 10);

      return json({
        totalStudents: students?.length || 0,
        totalAttempts: attempts?.length || 0,
        averageScore: Math.round(avgScore * 100) / 100,
        averageCompletionTime: Math.round(avgTime),
        totalPointsAwarded: Math.round(totalPointsAwarded * 100) / 100,
        topStudents,
        mostAttempted,
        mostDifficult,
      });
    }

    // ─── ADMIN ACTIVITY LOG ──────────────────────────────
    if (path === "/activity-log" && req.method === "GET") {
      const { data, error } = await supabase.from("admin_activity_log").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
