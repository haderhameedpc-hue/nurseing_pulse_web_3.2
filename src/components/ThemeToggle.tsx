import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme === "dark" : true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="btn-ghost p-2 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      title={isDark ? "تحويل إلى الوضع النهاري" : "تحويل إلى الوضع الليلي"}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 animate-fadeIn" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600 animate-fadeIn" />
      )}
    </button>
  );
}