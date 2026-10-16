import { useState, useEffect, useCallback } from "react";
import type { Student } from "@/lib/api";
import { studentApi, adminApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const STUDENT_KEY = "quiz_student_id";
const ADMIN_TOKEN_KEY = "quiz_admin_token";

function generateAnonName(): string {
  const random = Math.random().toString(36).substring(2, 10);
  return `زائر_${random}`;
}

export function useStudent() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStudent = useCallback(async () => {
    const id = localStorage.getItem(STUDENT_KEY);
    if (!id) {
      try {
        const { data: newStudent, error } = await supabase
          .from("students")
          .insert({ display_name: generateAnonName() })
          .select()
          .single();
        if (error) throw error;
        if (newStudent) {
          localStorage.setItem(STUDENT_KEY, newStudent.id);
          setStudent(newStudent);
        }
      } catch {
        // If anonymous creation fails, still let user proceed
      }
      setLoading(false);
      return;
    }
    try {
      const data = await studentApi.getStudent(id);
      setStudent(data.student);
    } catch {
      localStorage.removeItem(STUDENT_KEY);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  const setStudentId = (id: string) => {
    localStorage.setItem(STUDENT_KEY, id);
  };

  const logout = () => {
    localStorage.removeItem(STUDENT_KEY);
    setStudent(null);
  };

  return { student, setStudent, setStudentId, logout, loading, reload: loadStudent };
}

export function useAdminToken() {
  const [token, setToken] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!t) {
      setValidating(false);
      return;
    }
    adminApi.validate(t).then((data: { valid: boolean }) => {
      if (!data.valid) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken(null);
      } else {
        setToken(t);
      }
      setValidating(false);
    }).catch(() => {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      setValidating(false);
    });
  }, []);

  const login = (t: string) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, t);
    setToken(t);
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
  };

  return { token, login, logout, validating };
}
