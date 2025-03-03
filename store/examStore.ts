import { create } from 'zustand';
import { examData } from '@/data/examData';
import { sidebarData } from '@/data/sidebarData';

export type Question = {
    id: string;
    question: string;
    options: string[];
    correct_answer: string;
    category: string;
};

export type ExamData = {
    examName: string;
    examTime: number; // minutes
    questions: Question[];
};

export type Screen = 'start' | 'exam' | 'results';

interface ExamState {
    currentScreen: Screen;
    examData: ExamData;
    sidebarData: any;
    sidebarVisible: boolean;
    currentQuestion: number;
    userAnswers: (string | null)[];
    skippedQuestions: boolean[];
    questionTimes: number[];
    questionStartTimes: (Date | null)[];
    examStartTime: Date | null;
    examEndTime: Date | null;
    timeRemaining: number;
    results: {
        score: number;
        maxScore: number;
        correctCount: number;
        incorrectCount: number;
        skippedCount: number;
        percentage: number;
        timeSpent: number;
        avgTimePerQuestion: number;
        masteryLevel: string;
    } | null;

    // Actions
    initExam: () => void;
    startExam: () => void;
    toggleSidebar: (show?: boolean) => void;
    submitAnswer: (answer: string) => void;
    skipQuestion: () => void;
    navigateToQuestion: (index: number) => void;
    submitExam: () => void;
    retakeExam: () => void;
    setTimeRemaining: (time: number) => void;
    updateQuestionTime: (time: number) => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
    currentScreen: 'start',
    examData: examData,
    sidebarData: sidebarData,
    sidebarVisible: true,
    currentQuestion: 0,
    userAnswers: [],
    skippedQuestions: [],
    questionTimes: [],
    questionStartTimes: [],
    examStartTime: null,
    examEndTime: null,
    timeRemaining: 0,
    results: null,

    initExam: () => {
        const { examData } = get();
        set({
            userAnswers: Array(examData.questions.length).fill(null),
            skippedQuestions: Array(examData.questions.length).fill(false),
            questionTimes: Array(examData.questions.length).fill(0),
            questionStartTimes: Array(examData.questions.length).fill(null),
            timeRemaining: examData.examTime * 60, // convert to seconds
        });
    },

    startExam: () => {
        const { initExam } = get();
        initExam();

        const questionStartTimes = [...get().questionStartTimes];
        questionStartTimes[0] = new Date();

        set({
            currentScreen: 'exam',
            sidebarVisible: false,
            examStartTime: new Date(),
            questionStartTimes,
        });
    },

    toggleSidebar: (show) => {
        const { sidebarVisible } = get();
        if (show !== undefined) {
            set({ sidebarVisible: show });
        } else {
            set({ sidebarVisible: !sidebarVisible });
        }
    },

    submitAnswer: (answer) => {
        const { currentQuestion, userAnswers, skippedQuestions } = get();
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestion] = answer;

        const newSkipped = [...skippedQuestions];
        newSkipped[currentQuestion] = false;

        set({
            userAnswers: newAnswers,
            skippedQuestions: newSkipped,
        });
    },

    skipQuestion: () => {
        const { currentQuestion, skippedQuestions, examData } = get();
        const newSkipped = [...skippedQuestions];
        newSkipped[currentQuestion] = true;

        set({ skippedQuestions: newSkipped });

        // Auto-navigate to next question if not the last one
        if (currentQuestion < examData.questions.length - 1) {
            get().navigateToQuestion(currentQuestion + 1);
        }
    },

    navigateToQuestion: (index) => {
        const { currentQuestion, questionStartTimes, questionTimes } = get();

        // Record time spent on current question
        if (questionStartTimes[currentQuestion]) {
            const endTime = new Date();
            const newTimes = [...questionTimes];
            newTimes[currentQuestion] += (endTime.getTime() - questionStartTimes[currentQuestion]!.getTime()) / 1000;

            const newStartTimes = [...questionStartTimes];
            newStartTimes[currentQuestion] = null;
            newStartTimes[index] = new Date();

            set({
                currentQuestion: index,
                questionTimes: newTimes,
                questionStartTimes: newStartTimes,
            });
        } else {
            const newStartTimes = [...questionStartTimes];
            newStartTimes[index] = new Date();

            set({
                currentQuestion: index,
                questionStartTimes: newStartTimes,
            });
        }
    },

    submitExam: () => {
        const {
            examData,
            userAnswers,
            skippedQuestions,
            questionTimes,
            currentQuestion,
            questionStartTimes,
            examStartTime
        } = get();

        // Record time for the last question
        const newTimes = [...questionTimes];
        if (questionStartTimes[currentQuestion]) {
            const endTime = new Date();
            newTimes[currentQuestion] += (endTime.getTime() - questionStartTimes[currentQuestion]!.getTime()) / 1000;
        }

        const examEndTime = new Date();
        const totalTimeSpent = (examEndTime.getTime() - examStartTime!.getTime()) / 1000;

        // Calculate results
        let correctCount = 0;
        let incorrectCount = 0;
        let skippedCount = 0;

        examData.questions.forEach((question, index) => {
            if (skippedQuestions[index]) {
                skippedCount++;
            } else if (userAnswers[index] === question.correct_answer) {
                correctCount++;
            } else if (userAnswers[index] !== null) {
                incorrectCount++;
            } else {
                skippedCount++;
            }
        });

        const score = correctCount;
        const maxScore = examData.questions.length;
        const percentage = Math.round((score / maxScore) * 100);

        // Calculate mastery level
        let masteryLevel = "Beginner";
        if (percentage >= 80) {
            masteryLevel = "Advanced";
        } else if (percentage >= 60) {
            masteryLevel = "Intermediate";
        } else if (percentage >= 40) {
            masteryLevel = "Basic";
        }

        set({
            currentScreen: 'results',
            sidebarVisible: true,
            examEndTime,
            questionTimes: newTimes,
            results: {
                score,
                maxScore,
                correctCount,
                incorrectCount,
                skippedCount,
                percentage,
                timeSpent: totalTimeSpent,
                avgTimePerQuestion: totalTimeSpent / examData.questions.length,
                masteryLevel
            }
        });
    },

    retakeExam: () => {
        set({
            currentScreen: 'start',
            currentQuestion: 0,
            userAnswers: [],
            skippedQuestions: [],
            questionTimes: [],
            questionStartTimes: [],
            examStartTime: null,
            examEndTime: null,
            results: null,
        });
    },

    setTimeRemaining: (time) => {
        set({ timeRemaining: time });
    },

    updateQuestionTime: (time) => {
        const { currentQuestion, questionTimes } = get();
        const newTimes = [...questionTimes];
        newTimes[currentQuestion] = time;
        set({ questionTimes: newTimes });
    },
}));
