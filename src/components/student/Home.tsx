import { useState, useEffect } from "react";
import {
  Trophy,
  Target,
  Clock,
  TrendingUp,
  Settings,
  LogOut,
  ChevronRight,
  FolderOpen,
  FileText,
  Layers,
  BookOpen,
  ListChecks,
  Shield,
  GraduationCap,
} from "lucide-react";
import type { Student, Stage, Course, Subject, Folder, Quiz, LeaderboardSettings } from "@/lib/api";
import { studentApi } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HomeProps {
  student: Student;
  onLogout: () => void;
  onOpenSettings: () => void;
  onSelectQuiz: (quiz: Quiz) => void;
}

export function Home({ student, onLogout, onOpenSettings, onSelectQuiz }: HomeProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [leaderboard, setLeaderboard] = useState<{
    students: Student[];
    settings: LeaderboardSettings | null;
    enabled: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  useEffect(() => {
    Promise.all([studentApi.getStructure(), studentApi.getLeaderboard()])
      .then(([struct, lb]) => {
        setStages(struct.stages);
        setCourses(struct.courses);
        setSubjects(struct.subjects);
        setFolders(struct.folders);
        setQuizzes(struct.quizzes);
        setLeaderboard(lb);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const visibleQuizzes = quizzes.filter((q) => {
    if (selectedFolder) return q.folder_id === selectedFolder.id;
    if (selectedSubject) return q.subject_id === selectedSubject.id && !q.folder_id;
    return false;
  });

  const subjectFolders = folders.filter((f) => f.subject_id === selectedSubject?.id);
  const subjectCourses = courses.filter((c) => c.stage_id === selectedStage?.id);
  const courseSubjects = subjects.filter((s) => s.course_id === selectedCourse?.id);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <span className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white text-lg leading-none">منصة الاختبار</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                أهلاً بك، {student.display_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0">
            <a
              href="#admin"
              className="btn-ghost flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 
              title="لوحة الإدارة"
            >
              <Shield className="w-4 h-4" />
            </a>
            <ThemeToggle />
            <button onClick={onOpenSettings} className="btn-ghost" title="الإعدادات">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={onLogout} className="btn-ghost" title="تسجيل الخروج">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">

        {/* مسار التنقل Breadcrumb */}
        <div className="card p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="flex items-center gap-1.5 text-sm flex-wrap">
            <button
              onClick={() => {
                setSelectedStage(null);
                setSelectedCourse(null);
                setSelectedSubject(null);
                setSelectedFolder(null);
              }}
              className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
            >
              جميع المراحل
            </button>
            {selectedStage && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <button
                  onClick={() => {
                    setSelectedCourse(null);
                    setSelectedSubject(null);
                    setSelectedFolder(null);
                  }}
                  className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
                >
                  {selectedStage.name}
                </button>
              </>
            )}
            {selectedCourse && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <button
                  onClick={() => {
                    setSelectedSubject(null);
                    setSelectedFolder(null);
                  }}
                  className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
                >
                  {selectedCourse.name}
                </button>
              </>
            )}
            {selectedSubject && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <button
                  onClick={() => setSelectedFolder(null)}
                  className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
                >
                  {selectedSubject.name}
                </button>
              </>
            )}
            {selectedFolder && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {selectedFolder.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* عرض المراحل والاختبارات */}
        <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          {!selectedStage && (
            <>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" /> اختر المرحلة الدراسية
              </h2>
              {stages.length === 0 ? (
                <EmptyState message="لا توجد مراحل دراسية متاحة حالياً." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stages.map((stage) => (
                    <NavItem
                      key={stage.id}
                      icon={<Layers className="w-5 h-5" />}
                      title={stage.name}
                      desc={stage.description}
                      onClick={() => setSelectedStage(stage)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {selectedStage && !selectedCourse && (
            <>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600" /> الكورسات في {selectedStage.name}
              </h2>
              {subjectCourses.length === 0 ? (
                <EmptyState message="لا توجد كورسات في هذه المرحلة بعد." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjectCourses.map((course) => (
                    <NavItem
                      key={course.id}
                      icon={<BookOpen className="w-5 h-5" />}
                      title={course.name}
                      desc={course.description}
                      onClick={() => setSelectedCourse(course)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {selectedCourse && !selectedSubject && (
            <>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-teal-600" /> المواد في {selectedCourse.name}
              </h2>
              {courseSubjects.length === 0 ? (
                <EmptyState message="لا توجد مواد في هذا الكورس بعد." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courseSubjects.map((subject) => (
                    <NavItem
                      key={subject.id}
                      icon={<ListChecks className="w-5 h-5" />}
                      title={subject.name}
                      desc={subject.description}
                      onClick={() => setSelectedSubject(subject)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {selectedSubject && !selectedFolder && (
            <>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" /> {selectedSubject.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjectFolders.map((folder) => (
                  <NavItem
                    key={folder.id}
                    icon={<FolderOpen className="w-5 h-5" />}
                    title={folder.name}
                    desc="مواضيع إضافية"
                    onClick={() => setSelectedFolder(folder)}
                  />
                ))}
                {visibleQuizzes.map((quiz) => (
                  <NavItem
                    key={quiz.id}
                    icon={<FileText className="w-5 h-5" />}
                    title={quiz.name}
                    desc={quiz.description}
                    onClick={() => onSelectQuiz(quiz)}
                    isQuiz
                  />
                ))}
                {subjectFolders.length === 0 && visibleQuizzes.length === 0 && (
                  <EmptyState message="لا توجد اختبارات متاحة في هذه المادة بعد." />
                )}
              </div>
            </>
          )}

          {selectedFolder && (
            <>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-teal-600" /> {selectedFolder.name}
              </h2>
              {visibleQuizzes.length === 0 ? (
                <EmptyState message="لا توجد اختبارات في هذا المجلد بعد." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleQuizzes.map((quiz) => (
                    <NavItem
                      key={quiz.id}
                      icon={<FileText className="w-5 h-5" />}
                      title={quiz.name}
                      desc={quiz.description}
                      onClick={() => onSelectQuiz(quiz)}
                      isQuiz
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* لوحة الصدارة - مفتوحة دائماً */}
        {leaderboard?.enabled && leaderboard.students.length > 0 && (
          <div className="card overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-lg">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base">لوحة الشرف (Leaderboard)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">ترتيب الطلاب وفقاً لإجمالي النقاط والمحاولات</p>
                </div>
              </div>
            </div>
            <LeaderboardTable
              students={leaderboard.students}
              settings={leaderboard.settings}
              currentStudentId={student.id}
            />
          </div>
        )}
        
        {/* ملخص الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="النقاط"
            value={student.total_points.toFixed(0)}
            color="text-amber-600 bg-amber-50 dark:bg-amber-950/40"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="الاختبارات المكتملة"
            value={student.total_completed_quizzes}
            color="text-teal-600 bg-teal-50 dark:bg-teal-950/40"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="أعلى درجة"
            value={student.highest_score.toFixed(0)}
            color="text-blue-600 bg-blue-50 dark:bg-blue-950/40"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="الوقت المستغرق"
            value={formatTime(student.total_time_spent_seconds)}
            color="text-slate-600 bg-slate-100 dark:bg-slate-800"
          />
        </div>

        

        
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="stat-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm">
      <div className={`inline-flex p-2 rounded-lg ${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function NavItem({
  icon,
  title,
  desc,
  onClick,
  isQuiz,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  isQuiz?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-right p-4 rounded-xl border transition-all hover:shadow-md hover:border-teal-400 dark:hover:border-teal-500 group ${
        isQuiz
          ? "border-teal-200 dark:border-teal-900/50 bg-teal-50/30 dark:bg-teal-950/20"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      }`}
    >
      <div className="flex items-start gap-3 flex-row-reverse">
        <div
          className={`p-2 rounded-lg ${
            isQuiz
              ? "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          } group-hover:scale-110 transition-transform shrink-0`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{title}</h3>
          {desc && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{desc}</p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-teal-500 transition-colors shrink-0 rotate-180" />
      </div>
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
        <FileText className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm">{message}</p>
    </div>
  );
}

function LeaderboardTable({
  students,
  settings,
  currentStudentId,
}: {
  students: Student[];
  settings: LeaderboardSettings | null;
  currentStudentId: string;
}) {
  const columns =
    settings?.columns_config?.filter((c) => c.enabled).sort((a, b) => a.order - b.order) || [];

  const renderCell = (st: Student, key: string, rank: number) => {
    switch (key) {
      case "rank":
        return rank;
      case "display_name": {
        if (st.id === currentStudentId) {
          return st.display_name;
        }
        return st.display_name.replace(/\d{2}$/, "").trim();
      }
      case "total_points":
        return st.total_points.toFixed(0);
      case "badges":
        return st.badge_count ?? 0;
      case "trophies":
        return st.trophy_count ?? 0;
      case "total_completed_quizzes":
        return st.total_completed_quizzes;
      case "highest_score":
        return st.highest_score.toFixed(0);
      case "total_attempts":
        return st.total_attempts;
      default:
        return "";
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-right">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((st, i) => {
            const isMe = st.id === currentStudentId;
            return (
              <tr
                key={st.id}
                className={`border-b border-slate-100 dark:border-slate-800 transition-colors ${
                  isMe
                    ? "bg-teal-50/70 dark:bg-teal-950/40 font-semibold"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 ${
                      col.key === "display_name"
                        ? "text-slate-900 dark:text-slate-100"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {col.key === "rank" && (
                      <span
                        className={
                          i === 0
                            ? "text-amber-500 font-bold"
                            : i === 1
                            ? "text-slate-400 font-bold"
                            : i === 2
                            ? "text-orange-400 font-bold"
                            : ""
                        }
                      >
                        #{renderCell(st, col.key, i + 1)}
                      </span>
                    )}

                    {col.key === "display_name" && (
                      <span className="flex items-center gap-2">
                        <span>{renderCell(st, col.key, i + 1)}</span>
                        {isMe && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-500/20 font-bold">
                            أنت
                          </span>
                        )}
                      </span>
                    )}

                    {col.key !== "rank" && col.key !== "display_name" && renderCell(st, col.key, i + 1)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}