"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Chart from "chart.js/auto";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    FiBook,
    FiBookmark,
    FiCalendar,
    FiClock,
    FiFileText,
    FiFilter,
    FiPlus,
    FiSearch,
    FiSettings,
    FiSliders,
    FiStar,
    FiUsers,
    FiX,
    FiChevronDown,
    FiChevronRight,
    FiUpload,
    FiDownload,
    FiTrash2,
    FiCheck,
    FiAlertCircle,
} from "react-icons/fi";

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
    category: string;
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

// Zod schema for exam import validation
const QuestionSchema = z.object({
    question: z.string().min(1, "Question text is required"),
    option_1: z.string().min(1, "Option 1 is required"),
    option_2: z.string().min(1, "Option 2 is required"),
    option_3: z.string().min(1, "Option 3 is required"),
    option_4: z.string().min(1, "Option 4 is required"),
    correct_answer: z.string().min(1, "Correct answer is required"),
    question_year: z.string().optional(),
});

const ExamImportSchema = z.array(QuestionSchema);

// Form schema for creating new exam
const CreateExamSchema = z.object({
    name: z.string().min(1, "Exam name is required"),
    subject: z.string().min(1, "Subject is required"),
    category: z.string().min(1, "Category is required"),
    timeLimit: z.number().min(1, "Time limit must be at least 1 minute"),
    questions: z.array(QuestionSchema).min(1, "At least one question is required"),
});

type CreateExamFormValues = z.infer<typeof CreateExamSchema>;

// Zustand store
interface DashboardState {
    exams: Exam[];
    attempts: ExamAttempt[];
    bookmarkedQuestions: BookmarkedQuestion[];
    searchQuery: string;
    filterCategory: string;
    sortBy: string;

    // Actions
    setSearchQuery: (query: string) => void;
    setFilterCategory: (category: string) => void;
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

const useDashboardStore = create<DashboardState>()(
    persist(
        (set) => ({
            exams: [],
            attempts: [],
            bookmarkedQuestions: [],
            searchQuery: "",
            filterCategory: "all",
            sortBy: "recent",

            setSearchQuery: (query) => set({ searchQuery: query }),
            setFilterCategory: (category) => set({ filterCategory: category }),
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

            addBookmarkedQuestion: (question) =>
                set((state) => ({
                    bookmarkedQuestions: [...state.bookmarkedQuestions, question],
                })),

            removeBookmarkedQuestion: (id) =>
                set((state) => ({
                    bookmarkedQuestions: state.bookmarkedQuestions.filter((q) => q.id !== id),
                })),

            addAttempt: (attempt) =>
                set((state) => {
                    // Update exam statistics when adding a new attempt
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

// Helper function to generate ID
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Helper function to format date
const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

// Helper function to format time
const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
};

export default function DashboardPage() {
    const router = useRouter();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importedQuestions, setImportedQuestions] = useState<any[]>([]);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "error">("success");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    // Get data from store
    const { exams, attempts, bookmarkedQuestions, searchQuery, filterCategory, sortBy, setSearchQuery, setFilterCategory, setSortBy, addExam, bookmarkExam, unbookmarkExam, removeBookmarkedQuestion } =
        useDashboardStore();

    // React Hook Form
    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        reset,
        setValue,
        watch,
    } = useForm<CreateExamFormValues>({
        resolver: zodResolver(CreateExamSchema),
        mode: "onChange",
        defaultValues: {
            name: "",
            subject: "",
            category: "Exam",
            timeLimit: 60,
            questions: [],
        },
    });

    // Log inputs and errors
    useEffect(() => {
        const subscription = watch((value) => {
            console.log('Form Inputs:', value);
            console.log('Validation Errors:', errors);
        });
        return () => subscription.unsubscribe();
    }, [errors]);

    // Initialize chart
    useEffect(() => {
        if (chartRef.current) {
            // Destroy previous chart instance if it exists
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            // Sample data for the chart
            const lastTwoWeeks = Array.from({ length: 14 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (13 - i));
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            });

            // Mock data for attempts per day
            const attemptsData = Array.from({ length: 14 }, () => Math.floor(Math.random() * 3));

            // Create new chart
            const ctx = chartRef.current.getContext("2d");
            if (ctx) {
                chartInstance.current = new Chart(ctx, {
                    type: "line",
                    data: {
                        labels: lastTwoWeeks,
                        datasets: [
                            {
                                label: "Exams Taken",
                                data: attemptsData,
                                borderColor: "#4f46e5",
                                backgroundColor: "rgba(79, 70, 229, 0.1)",
                                tension: 0.4,
                                fill: true,
                                pointBackgroundColor: "#4f46e5",
                                pointRadius: 4,
                                pointHoverRadius: 6,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false,
                            },
                            tooltip: {
                                backgroundColor: "#1f2937",
                                padding: 12,
                                titleFont: {
                                    size: 14,
                                    family: "Inter",
                                },
                                bodyFont: {
                                    size: 13,
                                    family: "Inter",
                                },
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1,
                                    font: {
                                        family: "Inter",
                                    },
                                },
                                grid: {
                                    color: "rgba(0, 0, 0, 0.05)",
                                },
                            },
                            x: {
                                grid: {
                                    display: false,
                                },
                                ticks: {
                                    font: {
                                        family: "Inter",
                                    },
                                },
                            },
                        },
                    },
                });
            }
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, []);

    // Handle file upload for exam import
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);

                // Validate JSON against schema
                const validationResult = ExamImportSchema.safeParse(json);

                if (validationResult.success) {
                    setImportedQuestions(validationResult.data);
                    setValue('questions', validationResult.data);
                    setImportError(null);

                    // Display success toast
                    displayToast("Questions imported successfully!", "success");
                } else {
                    console.error("Validation errors:", validationResult.error);
                    setImportError(validationResult.error.message);
                    setImportedQuestions([]);

                    // Display error toast
                    displayToast("Invalid question format. Please check the file and try again.", "error");
                }
            } catch (error) {
                console.error("Error parsing JSON:", error);
                setImportError("Invalid JSON format. Please check the file and try again.");
                setImportedQuestions([]);

                // Display error toast
                displayToast("Invalid JSON format. Please check the file and try again.", "error");
            }
        };

        reader.readAsText(file);
    };

    // Handle form submission for creating a new exam
    const onSubmit = (data: CreateExamFormValues) => {
        // Transform the imported questions to the right format
        const formattedQuestions: Question[] = importedQuestions.map((q) => ({
            id: generateId(),
            question: q.question,
            options: [q.option_1, q.option_2, q.option_3, q.option_4],
            correct_answer: q.correct_answer,
            category: data.subject,
            year: q.question_year,
        }));

        // Create new exam
        const newExam: Exam = {
            id: generateId(),
            name: data.name,
            subject: data.subject,
            category: data.category,
            timeLimit: data.timeLimit,
            questions: formattedQuestions,
            createdAt: Date.now(),
            totalAttempts: 0,
            bestScore: 0,
            avgScore: 0,
            isBookmarked: false,
        };

        // Add to store
        addExam(newExam);

        // Reset form and close modal
        reset();
        setImportedQuestions([]);
        setShowCreateModal(false);

        // Show success toast
        displayToast("Exam created successfully!", "success");

        console.log('Imported Questions:', importedQuestions);
        console.log('New Exam:', newExam);
    };

    // Helper function to display toast
    const displayToast = (message: string, type: "success" | "error") => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);

        // Hide toast after 3 seconds
        setTimeout(() => {
            setShowToast(false);
        }, 3000);
    };

    // Filter and sort exams
    const filteredExams = exams
        .filter((exam) => {
            // Apply search filter
            if (searchQuery && !exam.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            // Apply category filter
            if (filterCategory !== "all" && exam.category.toLowerCase() !== filterCategory.toLowerCase()) {
                return false;
            }

            return true;
        })
        .sort((a, b) => {
            // Apply sorting
            switch (sortBy) {
                case "recent":
                    return b.createdAt - a.createdAt;
                case "oldest":
                    return a.createdAt - b.createdAt;
                case "name-asc":
                    return a.name.localeCompare(b.name);
                case "name-desc":
                    return b.name.localeCompare(a.name);
                case "attempts":
                    return b.totalAttempts - a.totalAttempts;
                case "score":
                    return b.bestScore - a.bestScore;
                default:
                    return 0;
            }
        });

    // Get recent attempts
    const recentAttempts = attempts.sort((a, b) => b.date - a.date).slice(0, 3);

    // Get recent bookmarks
    const recentBookmarks = bookmarkedQuestions.sort((a, b) => b.bookmarkedAt - a.bookmarkedAt).slice(0, 3);

    // Calculate stats
    const totalExams = exams.length;
    const totalAttempts = attempts.length;
    const avgScore = attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length) : 0;
    const totalBookmarks = bookmarkedQuestions.length;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Exam Portal Dashboard</h1>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition-all flex items-center space-x-2"
                        >
                            <FiPlus size={18} />
                            <span>Create New Exam</span>
                        </button>
                        <button className="p-2 bg-gray-100 text-gray-700 rounded-md shadow-sm hover:bg-gray-200 transition-all">
                            <FiSliders size={18} />
                        </button>
                        <button className="p-2 bg-gray-100 text-gray-700 rounded-md shadow-sm hover:bg-gray-200 transition-all">
                            <FiSettings size={18} />
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-700">Total Exams</h3>
                            <div className="p-2 bg-blue-100 rounded-md">
                                <FiFileText className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold">{totalExams}</div>
                        <div className="text-sm text-gray-500 mt-2">Available in the portal</div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-700">Total Attempts</h3>
                            <div className="p-2 bg-green-100 rounded-md">
                                <FiClock className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold">{totalAttempts}</div>
                        <div className="text-sm text-gray-500 mt-2">Across all exams</div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-700">Avg. Score</h3>
                            <div className="p-2 bg-yellow-100 rounded-md">
                                <FiStar className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold">{avgScore}%</div>
                        <div className="text-sm text-gray-500 mt-2">Performance metric</div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-700">Bookmarks</h3>
                            <div className="p-2 bg-purple-100 rounded-md">
                                <FiBookmark className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold">{totalBookmarks}</div>
                        <div className="text-sm text-gray-500 mt-2">Saved questions</div>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search exams..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="absolute left-3 top-2.5 text-gray-400">
                                <FiSearch className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <select
                                className="pl-4 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                <option value="exam">Exams</option>
                                <option value="quiz">Quizzes</option>
                                <option value="practice">Practice</option>
                            </select>
                            <select
                                className="pl-4 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="recent">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="name-asc">A-Z</option>
                                <option value="name-desc">Z-A</option>
                                <option value="attempts">Most Attempted</option>
                                <option value="score">Highest Score</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Study Progress Section */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Study Progress</h2>
                        <button className="text-sm text-gray-600 flex items-center">
                            Last 14 Days
                            <FiChevronDown className="h-4 w-4 ml-1" />
                        </button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                                <div className="text-blue-500 text-sm font-medium mb-1">Exams Completed</div>
                                <div className="text-3xl font-bold text-gray-800">{totalAttempts}</div>
                                <div className="text-xs text-gray-500 mt-1">{exams.length > 0 ? `${Math.round((totalAttempts / exams.length) * 100)}% completion rate` : "No exams available"}</div>
                            </div>

                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                <div className="text-green-500 text-sm font-medium mb-1">Average Score</div>
                                <div className="text-3xl font-bold text-gray-800">{avgScore}%</div>
                                <div className="text-xs text-gray-500 mt-1">Across all attempts</div>
                            </div>

                            <div className="bg-purple-50 rounded-lg p-4 text-center">
                                <div className="text-purple-500 text-sm font-medium mb-1">Study Time</div>
                                <div className="text-3xl font-bold text-gray-800">{attempts.reduce((sum, a) => sum + a.timeSpent, 0)}m</div>
                                <div className="text-xs text-gray-500 mt-1">Total time spent</div>
                            </div>
                        </div>

                        <div className="h-64 rounded-lg">
                            <canvas ref={chartRef}></canvas>
                        </div>
                    </div>
                </div>

                {/* Question Papers Section */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Question Papers</h2>
                        <div className="flex space-x-3">
                            <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md">All</button>
                            <button className="px-3 py-1.5 text-sm bg-white text-gray-600 rounded-md border border-gray-200">Exams</button>
                            <button className="px-3 py-1.5 text-sm bg-white text-gray-600 rounded-md border border-gray-200">Quizzes</button>
                            <button className="px-3 py-1.5 text-sm bg-white text-gray-600 rounded-md border border-gray-200">Practice</button>
                        </div>
                    </div>

                    {filteredExams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredExams.map((exam) => {
                                // Generate a consistent tag color based on subject name
                                const colors = ["green", "blue", "purple", "pink", "yellow"];
                                const colorIndex = exam.subject.charCodeAt(0) % colors.length;
                                const tagColorClass = `bg-${colors[colorIndex]}-100 text-${colors[colorIndex]}-800`;

                                return (
                                    <div key={exam.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all hover:shadow-md relative">
                                        <div className="absolute top-3 right-3">
                                            <button
                                                className="text-gray-400 hover:text-yellow-500 transition-all"
                                                onClick={() => (exam.isBookmarked ? unbookmarkExam(exam.id) : bookmarkExam(exam.id))}
                                            >
                                                <FiBookmark className={`h-6 w-6 ${exam.isBookmarked ? "text-yellow-500 fill-yellow-500" : ""}`} />
                                            </button>
                                        </div>
                                        <div className="p-5">
                                            <div className="flex items-start mb-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${tagColorClass}`}>{exam.subject.substring(0, 3).toUpperCase()}</span>
                                            </div>
                                            <h3 className="font-semibold text-lg mb-2">{exam.name}</h3>
                                            <div className="flex items-center text-sm text-gray-500 mb-4">
                                                <FiCalendar className="h-4 w-4 mr-1" />
                                                {formatDate(exam.createdAt)}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{exam.questions.length} Questions</span>
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{exam.timeLimit} Minutes</span>
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{exam.category}</span>
                                            </div>

                                            {exam.totalAttempts > 0 && (
                                                <div className="mb-4">
                                                    <div className="flex justify-between items-center mb-1 text-xs">
                                                        <span>Best Score: {exam.bestScore}%</span>
                                                        <span>Avg: {exam.avgScore}%</span>
                                                    </div>
                                                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-1 bg-green-500 rounded-full" style={{ width: `${exam.bestScore}%` }}></div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center">
                                                <div className="flex -space-x-2">
                                                    {exam.totalAttempts > 0 && (
                                                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">{exam.avgScore}%</div>
                                                    )}
                                                    {exam.totalAttempts > 1 && (
                                                        <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">+{exam.totalAttempts - 1}</div>
                                                    )}
                                                </div>
                                                <button onClick={() => router.push(`/exam/${exam.id}`)} className="text-indigo-600 text-sm font-medium">
                                                    Start Exam
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <FiFileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-700 mb-2">No exams found</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                {searchQuery || filterCategory !== "all"
                                    ? "No exams match your search criteria. Try adjusting your filters."
                                    : "Create your first exam by clicking the 'Create New Exam' button."}
                            </p>
                            <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition-all">
                                Create New Exam
                            </button>
                        </div>
                    )}

                    {filteredExams.length > 0 && (
                        <div className="flex justify-center mt-6">
                            <button className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-md font-medium text-sm hover:bg-gray-200 focus:outline-none transition-all">View All Papers</button>
                        </div>
                    )}
                </div>

                {/* Recent Attempts */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Recent Attempts</h2>
                        <button className="text-sm text-indigo-600 hover:text-indigo-800">View All</button>
                    </div>

                    {recentAttempts.length > 0 ? (
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Exam
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Score
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Time
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentAttempts.map((attempt) => {
                                        const exam = exams.find((e) => e.id === attempt.examId);

                                        // Determine score color class
                                        let scoreColorClass = "text-red-600";
                                        if (attempt.score >= 80) {
                                            scoreColorClass = "text-green-600";
                                        } else if (attempt.score >= 60) {
                                            scoreColorClass = "text-blue-600";
                                        } else if (attempt.score >= 40) {
                                            scoreColorClass = "text-yellow-600";
                                        }

                                        return (
                                            <tr key={attempt.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-gray-900">{exam?.name || "Unknown Exam"}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(attempt.date)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`font-medium ${scoreColorClass}`}>{attempt.score}%</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{attempt.timeSpent} minutes</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button onClick={() => router.push(`/results/${attempt.id}`)} className="text-indigo-600 hover:text-indigo-800">
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-10 bg-white rounded-lg shadow-sm flex flex-col items-center justify-center text-center">
                            <FiClock className="h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-700 mb-2">No attempts yet</h3>
                            <p className="text-gray-500 max-w-md">Start taking exams to see your recent attempts here.</p>
                        </div>
                    )}
                </div>

                {/* Bookmarked Questions */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Bookmarked Questions</h2>
                        <button className="text-sm text-indigo-600 hover:text-indigo-800">View All</button>
                    </div>

                    {recentBookmarks.length > 0 ? (
                        <div className="space-y-4">
                            {recentBookmarks.map((bookmark) => (
                                <div key={bookmark.id} className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-400">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">{bookmark.examName}</span>
                                            {/* {bookmark.question.year && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{bookmark.question.year}</span>} */}
                                        </div>
                                        <button onClick={() => removeBookmarkedQuestion(bookmark.id)} className="text-yellow-500 hover:text-yellow-600">
                                            <FiBookmark className="h-5 w-5 fill-yellow-500" />
                                        </button>
                                    </div>
                                    <p className="text-gray-800 font-medium mb-3">{bookmark.question}</p>
                                    <div className="text-sm text-green-600 font-medium">
                                        <span>Correct answer: </span>
                                        <span>{bookmark.correct_answer}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-10 bg-white rounded-lg shadow-sm flex flex-col items-center justify-center text-center">
                            <FiBookmark className="h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-700 mb-2">No bookmarked questions</h3>
                            <p className="text-gray-500 max-w-md">Bookmark questions during exams to review them later.</p>
                        </div>
                    )}
                </div>

                {/* Create Exam Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-auto p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-xl font-bold">Create New Exam</h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <FiX className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="mb-6">
                                    <div className="mb-4">
                                        <label htmlFor="examName" className="block text-sm font-medium text-gray-700 mb-1">
                                            Exam Name
                                        </label>
                                        <input
                                            id="examName"
                                            placeholder="Enter exam name"
                                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                                errors.name ? "border-red-300" : "border-gray-300"
                                            }`}
                                            {...register("name")}
                                        />
                                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                                                Subject
                                            </label>
                                            <input
                                                id="subject"
                                                placeholder="e.g. History"
                                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                                    errors.subject ? "border-red-300" : "border-gray-300"
                                                }`}
                                                {...register("subject")}
                                            />
                                            {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>}
                                        </div>

                                        <div>
                                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                                Category
                                            </label>
                                            <select
                                                id="category"
                                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                                    errors.category ? "border-red-300" : "border-gray-300"
                                                }`}
                                                {...register("category")}
                                            >
                                                <option value="Exam">Exam</option>
                                                <option value="Quiz">Quiz</option>
                                                <option value="Practice">Practice</option>
                                            </select>
                                            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
                                        </div>

                                        <div>
                                            <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 mb-1">
                                                Time Limit (minutes)
                                            </label>
                                            <input
                                                type="number"
                                                id="timeLimit"
                                                placeholder="e.g. 60"
                                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                                    errors.timeLimit ? "border-red-300" : "border-gray-300"
                                                }`}
                                                {...register("timeLimit", { valueAsNumber: true })}
                                            />
                                            {errors.timeLimit && <p className="mt-1 text-sm text-red-600">{errors.timeLimit.message}</p>}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Questions (JSON)</label>
                                        <div
                                            className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <FiUpload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                            <p className="text-gray-700 mb-2">Drag and drop your JSON file here</p>
                                            <p className="text-gray-500 text-sm mb-3">or</p>
                                            <button type="button" className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition-all inline-block">
                                                Browse Files
                                            </button>
                                            <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleFileUpload} />
                                            {importedQuestions.length > 0 && <p className="mt-3 text-sm text-green-600">{importedQuestions.length} questions loaded successfully</p>}
                                            {importError && <p className="mt-3 text-sm text-red-600">{importError}</p>}
                                        </div>
                                    </div>

                                    {importedQuestions.length > 0 && (
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                                            <div className="border border-gray-300 rounded-md p-4 bg-gray-50 max-h-60 overflow-y-auto">
                                                <div className="text-sm text-gray-700">
                                                    {importedQuestions.map((q, i) => (
                                                        <div key={i} className="mb-3 pb-3 border-b border-gray-200 last:border-0">
                                                            <p className="font-medium">
                                                                {i + 1}. {q.question}
                                                            </p>
                                                            <div className="ml-4 mt-1 text-gray-600">
                                                                <p>A. {q.option_1}</p>
                                                                <p>B. {q.option_2}</p>
                                                                <p>C. {q.option_3}</p>
                                                                <p>D. {q.option_4}</p>
                                                                <p className="text-green-600 mt-1">Correct: {q.correct_answer}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-all">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={`px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition-all ${
                                            !isValid || importedQuestions.length === 0 ? "opacity-50 cursor-not-allowed" : ""
                                        }`}
                                        disabled={!isValid || importedQuestions.length === 0}
                                    >
                                        Create Exam
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Toast Notification */}
                <div className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 transition-all transform ${showToast ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}>
                    <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">{toastType === "success" ? <FiCheck className="h-5 w-5 text-green-500" /> : <FiAlertCircle className="h-5 w-5 text-red-500" />}</div>
                        <div>
                            <p className="font-medium text-gray-900">{toastMessage}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
