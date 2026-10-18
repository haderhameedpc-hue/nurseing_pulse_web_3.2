import { useEffect } from "react";
import MainApp from "./components/MainApp";

// تم وضع استيراد شاشة التحميل كتعليق إذا أردت إرجاعها مستقبلاً
// import WelcomePage from "./components/WelcomePage";

export default function App() {
  useEffect(() => {
    // تفعيل الوضع الداكن في جذور الموقع فور التحميل
    document.documentElement.classList.add('dark');
  }, []);

  return (
    /* أضفنا dark:bg-gray-950 لضمان سواد الخلفية منذ اللحظة الأولى */
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* تم إزالة شاشة التحميل (WelcomePage) نهائياً من هنا */}
      {/* الدخول مباشرة إلى المكون الرئيسي الذي يحتوي على الاختبار التفاعلي */}
      <MainApp />
    </div>
  );
}