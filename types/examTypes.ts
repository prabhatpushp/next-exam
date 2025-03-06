// Types
type Question = {
    id: string;
    question: string;
    options: string[];
    correct_answer: string;
    category: string;
    year?: string;
};

type Exam = {
    id: string;
    name: string;
    subject: string;
    timeLimit: number;
    questions: Question[];
    createdAt: number;
    totalAttempts: number;
    bestScore: number;
    avgScore: number;
    isBookmarked: boolean;
};

type ExamAttempt = {
    id: string;
    examId: string;
    date: number;
    score: number;
    timeSpent: number;
    answeredQuestions: number;
    totalQuestions: number;
    submittedAnswers: { questionId: string; answer: string | null }[];
};

type BookmarkedQuestion = {
    id: string;
    examId: string;
    examName: string;
    questionId: string;
    question: string;
    options: string[];
    correct_answer: string;
    bookmarkedAt: number;
};

export type { Question, Exam, ExamAttempt, BookmarkedQuestion };
