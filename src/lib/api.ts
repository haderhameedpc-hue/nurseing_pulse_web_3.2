import { API_BASE } from "./supabase";

export interface Student {
  id: string;
  display_name: string;
  total_points: number;
  total_completed_quizzes: number;
  total_attempts: number;
  highest_score: number;
  total_time_spent_seconds: number;
  last_active_at: string;
  created_at: string;
  badge_count?: number;
  trophy_count?: number;
}

export interface Stage {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  sort_order: number;
  is_enabled: boolean;
  is_visible: boolean;
  created_at: string;
}

export interface Course {
  id: string;
  stage_id: string;
  name: string;
  description: string;
  icon_url: string;
  sort_order: number;
  is_enabled: boolean;
  is_visible: boolean;
}

export interface Subject {
  id: string;
  course_id: string;
  name: string;
  description: string;
  icon_url: string;
  sort_order: number;
  is_enabled: boolean;
  is_visible: boolean;
}

export interface Folder {
  id: string;
  subject_id: string;
  name: string;
  sort_order: number;
  is_enabled: boolean;
  is_visible: boolean;
}

export interface Quiz {
  id: string;
  subject_id: string | null;
  folder_id: string | null;
  name: string;
  description: string;
  instructions: string;
  max_points: number;
  timed_mode_enabled: boolean;
  untimed_mode_enabled: boolean;
  time_limit_seconds: number;
  timed_bonus_points: number;
  immediate_feedback: boolean;
  show_explanations: boolean;
  show_translations: boolean;
  review_wrong_answers: boolean;
  is_enabled: boolean;
  is_visible: boolean;
  sort_order: number;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_translation: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  correct_answer: "a" | "b" | "c" | "d";
  correct_answer_translation: string;
  explanation: string;
  sort_order: number;
  is_enabled: boolean;
  is_visible: boolean;
}

export interface QuizAttempt {
  id: string;
  student_id: string;
  quiz_id: string;
  mode: "timed" | "untimed";
  score: number;
  max_score: number;
  percentage: number;
  correct_answers: number;
  wrong_answers: number;
  total_questions: number;
  completion_time_seconds: number;
  earned_points: number;
  timed_bonus_points: number;
  status: string;
  is_100_percent: boolean;
  created_at: string;
  quizzes?: { name: string };
  students?: { display_name: string };
}

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  student_answer: "a" | "b" | "c" | "d" | null;
  correct_answer: "a" | "b" | "c" | "d";
  is_correct: boolean;
  time_spent_seconds: number;
  sort_order: number;
  questions?: Question;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  achievement_type: "badge" | "trophy";
  condition_type: string;
  condition_value: Record<string, unknown>;
  is_enabled: boolean;
  is_visible: boolean;
}

export interface QuestionTemplate {
  id: string;
  name: string;
  template_text: string;
  parsing_rules: Record<string, unknown>;
  is_enabled: boolean;
}

export interface LeaderboardSettings {
  id: number;
  is_enabled: boolean;
  columns_config: Array<{ key: string; label: string; enabled: boolean; order: number }>;
  sort_by: string;
  sort_direction: "asc" | "desc";
}

export interface NameChangeRecord {
  id: string;
  student_id: string;
  previous_name: string;
  new_name: string;
  changed_at: string;
  students?: { display_name: string; id: string };
}

// ─── API helpers ──────────────────────────────────────────

async function apiCall(endpoint: string, options: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data;
}

// ─── Student API ──────────────────────────────────────────

export const studentApi = {
  register: (display_name: string) =>
    apiCall("/quiz-api/register", { method: "POST", body: JSON.stringify({ display_name }) }),
  login: (display_name: string) =>
    apiCall("/quiz-api/login", { method: "POST", body: JSON.stringify({ display_name }) }),
  getStudent: (id: string) =>
    apiCall(`/quiz-api/student/${id}`),
  changeName: (student_id: string, new_name: string) =>
    apiCall("/quiz-api/change-name", { method: "POST", body: JSON.stringify({ student_id, new_name }) }),
  getStructure: () =>
    apiCall("/quiz-api/structure"),
  getQuiz: (id: string) =>
    apiCall(`/quiz-api/quiz/${id}`),
  submitAttempt: (payload: { student_id: string; quiz_id: string; mode: string; answers: Record<string, { answer: string; time_spent: number }>; completion_time_seconds: number }) =>
    apiCall("/quiz-api/submit-attempt", { method: "POST", body: JSON.stringify(payload) }),
  getAttempt: (id: string) =>
    apiCall(`/quiz-api/attempt/${id}`),
  getMyAttempts: (studentId: string) =>
    apiCall(`/quiz-api/my-attempts/${studentId}`),
  getLeaderboard: () =>
    apiCall("/quiz-api/leaderboard"),
};

// ─── Admin API ────────────────────────────────────────────

export const adminApi = {
  login: (password: string) =>
    apiCall("/admin-api/login", { method: "POST", body: JSON.stringify({ password }) }),
  logout: (token: string) =>
    apiCall("/admin-api/logout", { method: "POST" }, token),
  validate: (token: string) =>
    apiCall("/admin-api/validate", {}, token),
  dashboard: (token: string) =>
    apiCall("/admin-api/dashboard", {}, token),

  // Stages
  getStages: (token: string) => apiCall("/admin-api/stages", {}, token),
  createStage: (token: string, data: Partial<Stage>) => apiCall("/admin-api/stages", { method: "POST", body: JSON.stringify(data) }, token),
  updateStage: (token: string, id: string, data: Partial<Stage>) => apiCall(`/admin-api/stages/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
  deleteStage: (token: string, id: string) => apiCall(`/admin-api/stages/${id}`, { method: "DELETE" }, token),

  // Courses
  getCourses: (token: string, stageId?: string) => apiCall(`/admin-api/courses${stageId ? `?stage_id=${stageId}` : ""}`, {}, token),
  createCourse: (token: string, data: Partial<Course>) => apiCall("/admin-api/courses", { method: "POST", body: JSON.stringify(data) }, token),
  updateCourse: (token: string, id: string, data: Partial<Course>) => apiCall(`/admin-api/courses/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
  deleteCourse: (token: string, id: string) => apiCall(`/admin-api/courses/${id}`, { method: "DELETE" }, token),

  // Subjects
  getSubjects: (token: string, courseId?: string) => apiCall(`/admin-api/subjects${courseId ? `?course_id=${courseId}` : ""}`, {}, token),
  createSubject: (token: string, data: Partial<Subject>) => apiCall("/admin-api/subjects", { method: "POST", body: JSON.stringify(data) }, token),
  updateSubject: (token: string, id: string, data: Partial<Subject>) => apiCall(`/admin-api/subjects/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
  deleteSubject: (token: string, id: string) => apiCall(`/admin-api/subjects/${id}`, { method: "DELETE" }, token),

  // Folders
  getFolders: (token: string, subjectId?: string) => apiCall(`/admin-api/folders${subjectId ? `?subject_id=${subjectId}` : ""}`, {}, token),
  createFolder: (token: string, data: Partial<Folder>) => apiCall("/admin-api/folders", { method: "POST", body: JSON.stringify(data) }, token),
  updateFolder: (token: string, id: string, data: Partial<Folder>) => apiCall(`/admin-api/folders/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
  deleteFolder: (token: string, id: string) => apiCall(`/admin-api/folders/${id}`, { method: "DELETE" }, token),

  // Quizzes
  getQuizzes: (token: string, subjectId?: string, folderId?: string) => {
    let qs = "";
    if (subjectId) qs += `?subject_id=${subjectId}`;
    if (folderId) qs += `${subjectId ? "&" : "?"}folder_id=${folderId}`;
    return apiCall(`/admin-api/quizzes${qs}`, {}, token);
  },
  createQuiz: (token: string, data: Partial<Quiz>) => apiCall("/admin-api/quizzes", { method: "POST", body: JSON.stringify(data) }, token),
  updateQuiz: (token: string, id: string, data: Partial<Quiz>) => apiCall(`/admin-api/quizzes/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
  deleteQuiz: (token: string, id: string) => apiCall(`/admin-api/quizzes/${id}`, { method: "DELETE" }, token),
  duplicateQuiz: (token: string, quiz_id: string, new_name?: string) => apiCall("/admin-api/quizzes/duplicate", { method: "POST", body: JSON.stringify({ quiz_id, new_name }) }, token),

  // Questions
  getQuestions: (token: string, quizId?: string, search?: string) => {
    let qs = "";
    if (quizId) qs += `?quiz_id=${quizId}`;
    if (search) qs += `${quizId ? "&" : "?"}search=${encodeURIComponent(search)}`;
    return apiCall(`/admin-api/questions${qs}`, {}, token);
  },
  createQuestion: (token: string, data: Partial<Question>) => apiCall("/admin-api/questions", { method: "POST", body: JSON.stringify(data) }, token),
  bulkImportQuestions: (token: string, questions: Partial<Question>[]) => apiCall("/admin-api/questions/bulk", { method: "POST", body: JSON.stringify({ questions }) }, token),
  duplicateQuestion: (token: string, question_id: string) => apiCall("/admin-api/questions/duplicate", { method: "POST", body: JSON.stringify({ question_id }) }, token),
  updateQuestion: (token: string, id: string, data: Partial<Question>) => apiCall(`/admin-api/questions/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
  deleteQuestion: (token: string, id: string) => apiCall(`/admin-api/questions/${id}`, { method: "DELETE" }, token),

  // Templates
  getTemplates: (token: string) => apiCall("/admin-api/templates", {}, token),
  createTemplate: (token: string, data: Partial<QuestionTemplate>) => apiCall("/admin-api/templates", { method: "POST", body: JSON.stringify(data) }, token),
  updateTemplate: (token: string, id: string, data: Partial<QuestionTemplate>) => apiCall(`/admin-api/templates/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
  deleteTemplate: (token: string, id: string) => apiCall(`/admin-api/templates/${id}`, { method: "DELETE" }, token),

  // Achievements
  getAchievements: (token: string) => apiCall("/admin-api/achievements", {}, token),
  createAchievement: (token: string, data: Partial<Achievement>) => apiCall("/admin-api/achievements", { method: "POST", body: JSON.stringify(data) }, token),
  updateAchievement: (token: string, id: string, data: Partial<Achievement>) => apiCall(`/admin-api/achievements/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
  deleteAchievement: (token: string, id: string) => apiCall(`/admin-api/achievements/${id}`, { method: "DELETE" }, token),

  // Leaderboard
  getLeaderboardSettings: (token: string) => apiCall("/admin-api/leaderboard-settings", {}, token),
  updateLeaderboardSettings: (token: string, data: Partial<LeaderboardSettings>) => apiCall("/admin-api/leaderboard-settings", { method: "PUT", body: JSON.stringify(data) }, token),

  // Students
  getStudents: (token: string, search?: string) => apiCall(`/admin-api/students${search ? `?search=${encodeURIComponent(search)}` : ""}`, {}, token),
  getStudentDetail: (token: string, id: string) => apiCall(`/admin-api/students/${id}`, {}, token),
  deleteStudent: (token: string, id: string) => apiCall(`/admin-api/students/${id}`, { method: "DELETE" }, token),

  // Attempts
  getAttempts: (token: string, studentId?: string, quizId?: string) => {
    let qs = "";
    if (studentId) qs += `?student_id=${studentId}`;
    if (quizId) qs += `${studentId ? "&" : "?"}quiz_id=${quizId}`;
    return apiCall(`/admin-api/attempts${qs}`, {}, token);
  },
  getAttemptDetail: (token: string, id: string) => apiCall(`/admin-api/attempts/${id}`, {}, token),

  // Name changes
  getNameChanges: (token: string, search?: string) => apiCall(`/admin-api/name-changes${search ? `?search=${encodeURIComponent(search)}` : ""}`, {}, token),

  // Reports
  getReports: (token: string) => apiCall("/admin-api/reports", {}, token),

  // Activity log
  getActivityLog: (token: string) => apiCall("/admin-api/activity-log", {}, token),
};
