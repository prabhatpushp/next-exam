import { BookmarkedQuestion, Exam, ExamAttempt } from "@/types/examTypes";
import { create } from "zustand";
import { persist } from "zustand/middleware";


// Zustand store
interface DashboardState {
    exams: Exam[];
    attempts: ExamAttempt[];
    bookmarkedQuestions: BookmarkedQuestion[];
    searchQuery: string;
    sortBy: string;

    // Actions
    setSearchQuery: (query: string) => void;
    setSortBy: (sortBy: string) => void;
    addExam: (exam: Exam) => void;
    removeExam: (id: string) => void;
    bookmarkExam: (id: string) => void;
    unbookmarkExam: (id: string) => void;
    addBookmarkedQuestion: (question: BookmarkedQuestion) => void;
    removeBookmarkedQuestion: (id: string) => void;
    addAttempt: (attempt: ExamAttempt) => void;
    removeAttempt: (id: string) => void;
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set) => ({
            exams: [],
            attempts: [],
            bookmarkedQuestions: [],
            searchQuery: "",
            sortBy: "recent",

            setSearchQuery: (query) => set({ searchQuery: query }),
            setSortBy: (sortBy) => set({ sortBy }),

            addExam: (exam) =>
                set((state) => ({
                    exams: [...state.exams, exam],
                })),

            removeExam: (id) =>
                set((state) => ({
                    exams: state.exams.filter((exam) => exam.id !== id),
                    attempts: state.attempts.filter((attempt) => attempt.examId !== id),
                    bookmarkedQuestions: state.bookmarkedQuestions.filter((q) => q.examId !== id),
                })),

            bookmarkExam: (id) =>
                set((state) => ({
                    exams: state.exams.map((exam) => (exam.id === id ? { ...exam, isBookmarked: true } : exam)),
                })),

            unbookmarkExam: (id) =>
                set((state) => ({
                    exams: state.exams.map((exam) => (exam.id === id ? { ...exam, isBookmarked: false } : exam)),
                })),

            addBookmarkedQuestion: (question: BookmarkedQuestion) =>
                set((state) => ({
                    bookmarkedQuestions: [...state.bookmarkedQuestions, question],
                })),

            removeBookmarkedQuestion: (id) =>
                set((state) => ({
                    bookmarkedQuestions: state.bookmarkedQuestions.filter((q) => q.id !== id),
                })),

            addAttempt: (attempt) =>
                set((state) => {
                    const updatedExams = state.exams.map((exam) => {
                        if (exam.id === attempt.examId) {
                            const examAttempts = [...state.attempts, attempt].filter((a) => a.examId === exam.id);
                            const totalAttempts = examAttempts.length;
                            const bestScore = Math.max(...examAttempts.map((a) => a.score), 0);
                            const avgScore = totalAttempts > 0 ? Math.round(examAttempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts) : 0;

                            return {
                                ...exam,
                                totalAttempts,
                                bestScore,
                                avgScore,
                            };
                        }
                        return exam;
                    });

                    return {
                        exams: updatedExams,
                        attempts: [...state.attempts, attempt],
                    };
                }),

            removeAttempt: (id) =>
                set((state) => ({
                    attempts: state.attempts.filter((attempt) => attempt.id !== id),
                })),
        }),
        {
            name: "exam-dashboard-storage",
        }
    )
);
