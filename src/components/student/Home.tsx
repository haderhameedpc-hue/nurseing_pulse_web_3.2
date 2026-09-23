import { useState, useEffect } from "react";
import { Trophy, Award, Target, Clock, TrendingUp, Settings, LogOut, ChevronRight, FolderOpen, FileText, Layers, BookOpen, ListChecks, Shield, GraduationCap } from "lucide-react";
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
  const [leaderboard, setLeaderboard] = useState<{ students: Student[]; settings: LeaderboardSettings | null; enabled: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

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

  const visibleQuizzes = quizzes.filter(q => {
    if (selectedFolder) return q.folder_id === selectedFolder.id;
    if (selectedSubject) return q.subject_id === selectedSubject.id && !q.folder_id;
    return false;
  });

  const subjectFolders = folders.filter(f => f.subject_id === selectedSubject?.id);
  const subjectCourses = courses.filter(c => c.stage_id === selectedStage?.id);
  const courseSubjects = subjects.filter(s => s.course_id === selectedCourse?.id);

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
              <h1 className="font-bold text-slate-900 dark:text-white text-lg leading-none">Quiz Platform</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Welcome, {student.display_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* زر لوحة الإدارة */}
            <a
              href="#admin"
              className="btn-ghost flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 border border-teal-500/30 px-3 py-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/40"
              title="لوحة الإدارة"
            >
              <Shield className="w-4 h-4" />
              <span>الإدارة</span>
            </a>

            {/* زر الوضع الليلي */}
            <ThemeToggle />

            {/* زر الإعدادات */}
            <button onClick={onOpenSettings} className="btn-ghost" title="Settings">
              <Settings className="w-5 h-5" />
            </button>

            {/* زر تسجيل الخروج */}
            <button onClick={onLogout} className="btn-ghost" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Quiz Navigation Breadcrumb */}
        <div className="card p-4 mb-4">
          <div className="flex items-center gap-1.5 text-sm flex-wrap">
            <button
              onClick={() => { setSelectedStage(null); setSelectedCourse(null); setSelectedSubject(null); setSelectedFolder(null); }}
              className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
            >
              All Stages
            </button>
            {selectedStage && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <button
                  onClick={() => { setSelectedCourse(null); setSelectedSubject(null); setSelectedFolder(null); }}
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
                  onClick={() => { setSelectedSubject(null); setSelectedFolder(null); }}
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
                <span className="font-medium text-slate-700 dark:text-slate-300">{selectedFolder.name}</span>
              </>
            )}
          </div>
        </div>

        {/* Quiz Navigation Content */}
        <div className="card p-6 mb-4">
          {!selectedStage && (
            <>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" /> Select a Stage
              </h2>
              {stages.length === 0 ? (
                <EmptyState message="No stages available yet. Please check back later." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stages.map(stage => (
                    <NavItem key={stage.id} icon={<Layers className="w-5 h-5" />} title={stage.name} desc={stage.description} onClick={() => setSelectedStage(stage)} />
                  ))}
                </div>
              )}
            </>
          )}

          {selectedStage && !selectedCourse && (
            <>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600" /> Courses in {selectedStage.name}
              </h2>
              {subjectCourses.length === 0 ? (
                <EmptyState message="No courses in this stage yet." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjectCourses.map(course => (
                    <NavItem key={course.id} icon={<BookOpen className="w-5 h-5" />} title={course.name} desc={course.description} onClick={() => setSelectedCourse(course)} />
                  ))}
                </div>
              )}
            </>
          )}

          {selectedCourse && !selectedSubject && (
            <>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-teal-600" /> Subjects in {selectedCourse.name}
              </h2>
              {courseSubjects.length === 0 ? (
                <EmptyState message="No subjects in this course yet." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courseSubjects.map(subject => (
                    <NavItem key={subject.id} icon={<ListChecks className="w-5 h-5" />} title={subject.name} desc={subject.description} onClick={() => setSelectedSubject(subject)} />
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
                {subjectFolders.map(folder => (
                  <NavItem key={folder.id} icon={<FolderOpen className="w-5 h-5" />} title={folder.name} desc="Additional topics" onClick={() => setSelectedFolder(folder)} />
                ))}
                {visibleQuizzes.map(quiz => (
                  <NavItem key={quiz.id} icon={<FileText className="w-5 h-5" />} title={quiz.name} desc={quiz.description} onClick={() => onSelectQuiz(quiz)} isQuiz />
                ))}
                {subjectFolders.length === 0 && visibleQuizzes.length === 0 && (
                  <EmptyState message="No quizzes or folders available in this subject yet." />
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
                <EmptyState message="No quizzes in this folder yet." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleQuizzes.map(quiz => (
                    <NavItem key={quiz.id} icon={<FileText className="w-5 h-5" />} title={quiz.name} desc={quiz.description} onClick={() => onSelectQuiz(quiz)} isQuiz />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Leaderboard toggle */}
        {leaderboard?.enabled && (
          <div className="mb-6">
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="w-full flex items-center justify-between p-4 card hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Leaderboard</span>
              </div>
              <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showLeaderboard ? "rotate-90" : ""}`} />
            </button>
            {showLeaderboard && leaderboard.students.length > 0 && (
              <div className="mt-3 card overflow-hidden animate-fadeIn">
                <LeaderboardTable students={leaderboard.students} settings={leaderboard.settings} currentStudentId={student.id} />
              </div>
            )}
          </div>
        )}
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Trophy className="w-5 h-5" />} label="Points" value={student.total_points.toFixed(0)} color="text-amber-600 bg-amber-50 dark:bg-amber-950/40" />
          <StatCard icon={<Target className="w-5 h-5" />} label="Completed" value={student.total_completed_quizzes} color="text-teal-600 bg-teal-50 dark:bg-teal-950/40" />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Highest" value={student.highest_score.toFixed(0)} color="text-blue-600 bg-blue-50 dark:bg-blue-950/40" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Time Spent" value={formatTime(student.total_time_spent_seconds)} color="text-slate-600 bg-slate-100 dark:bg-slate-800" />
        </div>

        

        
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="stat-card">
      <div className={`inline-flex p-2 rounded-lg ${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function NavItem({ icon, title, desc, onClick, isQuiz }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void; isQuiz?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-all hover:shadow-md hover:border-teal-300 dark:hover:border-teal-500 group ${
        isQuiz 
          ? "border-teal-200 dark:border-teal-900/50 bg-teal-50/30 dark:bg-teal-950/20" 
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isQuiz ? "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 truncate">{title}</h3>
          {desc && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{desc}</p>}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-teal-500 transition-colors flex-shrink-0" />
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
      <p className="text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}

function LeaderboardTable({ students, settings, currentStudentId }: { students: Student[]; settings: LeaderboardSettings | null; currentStudentId: string }) {
  const columns = settings?.columns_config?.filter(c => c.enabled).sort((a, b) => a.order - b.order) || [];
  const renderCell = (student: Student, key: string, rank: number) => {
    switch (key) {
      case "rank": return rank;
      case "display_name": return student.display_name;
      case "total_points": return student.total_points.toFixed(0);
      case "badges": return student.badge_count ?? 0;
      case "trophies": return student.trophy_count ?? 0;
      case "total_completed_quizzes": return student.total_completed_quizzes;
      case "highest_score": return student.highest_score.toFixed(0);
      case "total_attempts": return student.total_attempts;
      default: return "";
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student, i) => (
            <tr key={student.id} className={`border-b border-slate-100 dark:border-slate-800 ${student.id === currentStudentId ? "bg-teal-50 dark:bg-teal-950/40" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"}`}>
              {columns.map(col => (
                <td key={col.key} className={`px-4 py-3 ${col.key === "rank" && i < 3 ? "font-bold" : ""} ${col.key === "display_name" ? "font-medium text-slate-800 dark:text-slate-200" : "text-slate-600 dark:text-slate-400"}`}>
                  {col.key === "rank" && i === 0 && <span className="text-amber-500">#{renderCell(student, col.key, i + 1)}</span>}
                  {col.key === "rank" && i === 1 && <span className="text-slate-400">#{renderCell(student, col.key, i + 1)}</span>}
                  {col.key === "rank" && i === 2 && <span className="text-orange-400">#{renderCell(student, col.key, i + 1)}</span>}
                  {col.key === "rank" && i >= 3 && `#${renderCell(student, col.key, i + 1)}`}
                  {col.key !== "rank" && renderCell(student, col.key, i + 1)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}