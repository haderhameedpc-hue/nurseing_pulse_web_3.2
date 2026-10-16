import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

// Validate name ends with exactly two digits
function isValidName(name: string): boolean {
  return /^\D.*\d{2}$/.test(name) && /\d{2}$/.test(name) && !/\d{3}$/.test(name);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/quiz-api/, "");
    const body = req.method !== "GET" ? await req.json().catch(() => ({})) : {};

    // ─── REGISTER ────────────────────────────────────────
    if (path === "/register" && req.method === "POST") {
      const { display_name } = body;
      if (!display_name || typeof display_name !== "string") {
        return json({ error: "Please enter your name." }, 400);
      }
      const trimmed = display_name.trim();
      if (!isValidName(trimmed)) {
        return json({ error: "Your name must end with exactly two digits (e.g. Ahmed12). The two digits help distinguish your account from other students with the same or similar name." }, 400);
      }

      // Check if student already exists
      const { data: existing } = await supabase.from("students").select("*").eq("display_name", trimmed).maybeSingle();
      if (existing) {
        return json({ student: existing, message: "Welcome back!" });
      }

      // Create new student
      const { data, error } = await supabase.from("students").insert({
        display_name: trimmed,
      }).select().single();
      if (error) return json({ error: error.message }, 500);
      return json({ student: data, message: "Registration successful!" });
    }

    // ─── LOGIN (returning student) ───────────────────────
    if (path === "/login" && req.method === "POST") {
      const { display_name } = body;
      if (!display_name) return json({ error: "Please enter your name." }, 400);
      const trimmed = display_name.trim();

      const { data, error } = await supabase.from("students").select("*").eq("display_name", trimmed).maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!data) {
        return json({ error: "No student found with that name. Please register first." }, 404);
      }
      await supabase.from("students").update({ last_active_at: new Date().toISOString() }).eq("id", data.id);
      return json({ student: data });
    }

    // ─── CHANGE NAME ─────────────────────────────────────
    if (path === "/change-name" && req.method === "POST") {
      const { student_id, new_name } = body;
      if (!student_id || !new_name) return json({ error: "Missing fields." }, 400);
      const trimmed = new_name.trim();
      if (!isValidName(trimmed)) {
        return json({ error: "The new name must also end with exactly two digits (e.g. Ali34). The two digits help distinguish your account from other students." }, 400);
      }

      // Check if new name is taken by another student
      const { data: conflict } = await supabase.from("students").select("id").eq("display_name", trimmed).neq("id", student_id).maybeSingle();
      if (conflict) return json({ error: "That name is already taken by another student. Please choose a different name." }, 400);

      // Get old name
      const { data: student, error: stErr } = await supabase.from("students").select("display_name").eq("id", student_id).maybeSingle();
      if (stErr || !student) return json({ error: "Student not found." }, 404);

      // Update name
      const { error: updateErr } = await supabase.from("students").update({ display_name: trimmed, updated_at: new Date().toISOString() }).eq("id", student_id);
      if (updateErr) return json({ error: updateErr.message }, 500);

      // Record name change
      await supabase.from("name_change_history").insert({
        student_id,
        previous_name: student.display_name,
        new_name: trimmed,
      });

      return json({ success: true, new_name: trimmed });
    }

    // ─── GET STUDENT ─────────────────────────────────────
    if (path.startsWith("/student/") && req.method === "GET") {
      const id = path.split("/")[2];
      const { data, error } = await supabase.from("students").select("*").eq("id", id).maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!data) return json({ error: "Student not found" }, 404);

      // Get achievements
      const { data: studentAchs } = await supabase.from("student_achievements").select("achievement_id, awarded_at, achievements(*)").eq("student_id", id);
      // Get recent attempts
      const { data: attempts } = await supabase.from("quiz_attempts").select("*, quizzes(name)").eq("student_id", id).order("created_at", { ascending: false }).limit(20);

      return json({ ...data, achievements: studentAchs || [], attempts: attempts || [] });
    }

    // ─── GET QUIZ STRUCTURE (student view) ───────────────
    if (path === "/structure" && req.method === "GET") {
      const { data: stages } = await supabase.from("stages").select("*").eq("is_enabled", true).eq("is_visible", true).order("sort_order");
      const { data: courses } = await supabase.from("courses").select("*").eq("is_enabled", true).eq("is_visible", true).order("sort_order");
      const { data: subjects } = await supabase.from("subjects").select("*").eq("is_enabled", true).eq("is_visible", true).order("sort_order");
      const { data: folders } = await supabase.from("folders").select("*").eq("is_enabled", true).eq("is_visible", true).order("sort_order");
      const { data: quizzes } = await supabase.from("quizzes").select("*").eq("is_enabled", true).eq("is_visible", true).order("sort_order");

      return json({ stages: stages || [], courses: courses || [], subjects: subjects || [], folders: folders || [], quizzes: quizzes || [] });
    }

    // ─── GET QUIZ WITH QUESTIONS (student view) ──────────
    if (path.startsWith("/quiz/") && req.method === "GET") {
      const id = path.split("/")[2];
      const { data: quiz, error } = await supabase.from("quizzes").select("*").eq("id", id).eq("is_enabled", true).maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!quiz) return json({ error: "Quiz not found" }, 404);

      const { data: questions } = await supabase.from("questions").select("id, quiz_id, question_text, question_translation, answer_a, answer_b, answer_c, answer_d, correct_answer, correct_answer_translation, explanation, sort_order, is_enabled, is_visible").eq("quiz_id", id).eq("is_enabled", true).eq("is_visible", true).order("sort_order");

      return json({ quiz, questions: questions || [] });
    }

    // ─── SUBMIT QUIZ ATTEMPT ─────────────────────────────
    if (path === "/submit-attempt" && req.method === "POST") {
      const { student_id, quiz_id, mode, answers, completion_time_seconds } = body;
      if (!student_id || !quiz_id || !mode || !answers) {
        return json({ error: "Missing required fields" }, 400);
      }

      // Call the server-side scoring function
      const { data, error } = await supabase.rpc("submit_quiz_attempt", {
        p_student_id: student_id,
        p_quiz_id: quiz_id,
        p_mode: mode,
        p_answers: answers,
        p_completion_time_seconds: completion_time_seconds || 0,
      });

      if (error) return json({ error: error.message }, 500);
      if (data?.error) return json({ error: data.error }, 400);
      return json(data);
    }

    // ─── GET ATTEMPT (for review wrong answers) ──────────
    if (path.startsWith("/attempt/") && req.method === "GET") {
      const id = path.split("/")[2];
      const { data: attempt, error } = await supabase.from("quiz_attempts").select("*").eq("id", id).maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!attempt) return json({ error: "Attempt not found" }, 404);

      const { data: answers } = await supabase.from("attempt_answers").select("*, questions(question_text, question_translation, answer_a, answer_b, answer_c, answer_d, correct_answer, correct_answer_translation, explanation)").eq("attempt_id", id).order("sort_order");

      return json({ ...attempt, answers: answers || [] });
    }

    // ─── GET ATTEMPT (student's own attempt) ─────────────
    if (path.startsWith("/my-attempts/") && req.method === "GET") {
      const studentId = path.split("/")[2];
      const { data, error } = await supabase.from("quiz_attempts").select("*, quizzes(name)").eq("student_id", studentId).order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json(data || []);
    }

    // ─── LEADERBOARD ─────────────────────────────────────
    if (path === "/leaderboard" && req.method === "GET") {
      // Get settings
      const { data: settings } = await supabase.from("leaderboard_settings").select("*").eq("id", 1).maybeSingle();
      if (!settings || !settings.is_enabled) {
        return json({ enabled: false, students: [], settings: null });
      }

      // Get all students sorted by the configured field
      const sortField = settings.sort_by || "total_points";
      const sortDir = settings.sort_direction || "desc";
      const { data: students, error } = await supabase.from("students").select("*").order(sortField, { ascending: sortDir === "asc" }).limit(100);
      if (error) return json({ error: error.message }, 500);

      // Enrich with badge/trophy counts
      const enriched = await Promise.all((students || []).map(async (s) => {
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

      return json({ enabled: true, students: enriched, settings });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
