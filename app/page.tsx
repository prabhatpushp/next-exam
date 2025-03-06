"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Chart from "chart.js/auto";

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
    FiEye,
    FiEyeOff,
    FiBarChart2,
    FiActivity,
} from "react-icons/fi";
import { useDashboardStore } from "@/store/dashboardStore";
import { Exam, Question } from "@/types/examTypes";

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
    timeLimit: z.number().min(1, "Time limit must be at least 1 minute"),
    questions: z.array(QuestionSchema).min(1, "At least one question is required"),
});

type CreateExamFormValues = z.infer<typeof CreateExamSchema>;

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
    const [showAnswers, setShowAnswers] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    // Get data from store
    const { exams, attempts, bookmarkedQuestions, searchQuery, sortBy, setSearchQuery, setSortBy, addExam, bookmarkExam, unbookmarkExam, removeBookmarkedQuestion, removeExam } =
        useDashboardStore();

    // React Hook Form
    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        reset,
        setValue,
    } = useForm<CreateExamFormValues>({
        resolver: zodResolver(CreateExamSchema),
        mode: "onChange",
        defaultValues: {
            name: "",
            subject: "",
            timeLimit: 60,
            questions: [],
        },
    });

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

    // Get category tag colors
    const getCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'exam':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'quiz':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'practice':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Get score color
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-blue-600';
        if (score >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Exam Portal Dashboard</h1>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-all flex items-center space-x-2 font-medium"
                        >
                            <FiPlus size={18} />
                            <span>Create New Exam</span>
                        </button>
                        {/* <button className="p-2.5 bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-all border border-gray-200">
                            <FiSliders size={20} />
                        </button>
                        <button className="p-2.5 bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-all border border-gray-200">
                            <FiSettings size={20} />
                        </button> */}
                    </div>
                </div>

                {/* Stats Overview */}
                {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-700">Total Exams</h3>
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <FiFileText className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900">{totalExams}</div>
                        <div className="text-sm text-gray-500 mt-2">Available in the portal</div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-700">Total Attempts</h3>
                            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                <FiActivity className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900">{totalAttempts}</div>
                        <div className="text-sm text-gray-500 mt-2">Across all exams</div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-700">Avg. Score</h3>
                            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                <FiBarChart2 className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900">{avgScore}%</div>
                        <div className="text-sm text-gray-500 mt-2">Performance metric</div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-700">Bookmarks</h3>
                            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                <FiBookmark className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900">{totalBookmarks}</div>
                        <div className="text-sm text-gray-500 mt-2">Saved questions</div>
                    </div>
                </div> */}

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-xl shadow-sm p-5 mb-8 border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search exams..."
                                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="absolute left-3.5 top-3 text-gray-400">
                                <FiSearch className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <select
                                    className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                                    <FiChevronDown className="h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Study Progress Section */}
                {/* <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Study Progress</h2>
                        <button className="text-sm text-gray-700 flex items-center bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                            Last 14 Days
                            <FiChevronDown className="h-4 w-4 ml-1" />
                        </button>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-blue-50 rounded-xl p-5 text-center border border-blue-100">
                                <div className="text-blue-600 text-sm font-medium mb-1">Exams Completed</div>
                                <div className="text-3xl font-bold text-gray-900">{totalAttempts}</div>
                                <div className="text-xs text-gray-600 mt-1">{exams.length > 0 ? `${Math.round((totalAttempts / exams.length) * 100)}% completion rate` : "No exams available"}</div>
                            </div>

                            <div className="bg-green-50 rounded-xl p-5 text-center border border-green-100">
                                <div className="text-green-600 text-sm font-medium mb-1">Average Score</div>
                                <div className="text-3xl font-bold text-gray-900">{avgScore}%</div>
                                <div className="text-xs text-gray-600 mt-1">Across all attempts</div>
                            </div>

                            <div className="bg-purple-50 rounded-xl p-5 text-center border border-purple-100">
                                <div className="text-purple-600 text-sm font-medium mb-1">Study Time</div>
                                <div className="text-3xl font-bold text-gray-900">{attempts.reduce((sum, a) => sum + a.timeSpent, 0)}m</div>
                                <div className="text-xs text-gray-600 mt-1">Total time spent</div>
                            </div>
                        </div>

                        <div className="h-64 rounded-lg">
                            <canvas ref={chartRef}></canvas>
                        </div>
                    </div>
                </div> */}

                {/* Question Papers Section */}
                <div className="mb-12">
                    {filteredExams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredExams.map((exam) => {
                                // Generate a consistent tag color based on subject name
                                const colors = ["green", "blue", "purple", "pink", "yellow"];
                                const colorIndex = exam.subject.charCodeAt(0) % colors.length;
                                const subjectTag = `bg-${colors[colorIndex]}-100 text-${colors[colorIndex]}-800 border border-${colors[colorIndex]}-200`;

                                return (
                                    <div key={exam.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all hover:shadow-md relative group">
                                        <div className="absolute top-3 right-3 z-10 flex space-x-2">
                                            <button
                                                className="text-gray-400 hover:text-yellow-500 transition-all p-1.5 bg-white rounded-full shadow-sm border border-gray-100"
                                                onClick={() => (exam.isBookmarked ? unbookmarkExam(exam.id) : bookmarkExam(exam.id))}
                                            >
                                                <FiBookmark className={`h-5 w-5 ${exam.isBookmarked ? "text-yellow-500 fill-yellow-500" : ""}`} />
                                            </button>
                                            <button
                                                className="text-gray-400 hover:text-red-500 transition-all p-1.5 bg-white rounded-full shadow-sm border border-gray-100"
                                                onClick={() => removeExam(exam.id)}
                                            >
                                                <FiTrash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <div className="p-5">
                                            <div className="flex items-start mb-4 space-x-2">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${subjectTag}`}>{exam.subject.substring(0, 3).toUpperCase()}</span>
                                            </div>
                                            <h3 className="font-semibold text-lg mb-3 text-gray-900">{exam.name}</h3>
                                            <div className="flex items-center text-sm text-gray-500 mb-4">
                                                <FiCalendar className="h-4 w-4 mr-1.5" />
                                                {formatDate(exam.createdAt)}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md border border-gray-200">
                                                    <span className="font-medium">{exam.questions.length}</span> Questions
                                                </span>
                                                <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md border border-gray-200">
                                                    <span className="font-medium">{exam.timeLimit}</span> Minutes
                                                </span>
                                            </div>

                                            {exam.totalAttempts > 0 && (
                                                <div className="mb-4">
                                                    <div className="flex justify-between items-center mb-1.5 text-xs">
                                                        <span className="font-medium">Best Score: <span className={getScoreColor(exam.bestScore)}>{exam.bestScore}%</span></span>
                                                        <span>Avg: {exam.avgScore}%</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-2 rounded-full ${getScoreColor(exam.bestScore).replace('text', 'bg')}`} 
                                                            style={{ width: `${exam.bestScore}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center">
                                                <div className="flex -space-x-2">
                                                    {exam.totalAttempts > 0 && (
                                                        <div className="w-7 h-7 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center border-2 border-white">{exam.avgScore}%</div>
                                                    )}
                                                    {exam.totalAttempts > 1 && (
                                                        <div className="w-7 h-7 rounded-full bg-green-500 text-white text-xs flex items-center justify-center border-2 border-white">+{exam.totalAttempts - 1}</div>
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={() => router.push(`/exam/${exam.id}`)} 
                                                    className="text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Start Exam
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                            <FiFileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-medium text-gray-700 mb-2">No exams found</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                {searchQuery
                                    ? "No exams match your search criteria. Try adjusting your filters."
                                    : "Create your first exam by clicking the 'Create New Exam' button."}
                            </p>
                            <button 
                                onClick={() => setShowCreateModal(true)} 
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-all font-medium"
                            >
                                Create New Exam
                            </button>
                        </div>
                    )}
                
                </div>

                {/* Recent Attempts */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Recent Attempts</h2>
                        <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View All</button>
                    </div>

                    {recentAttempts.length > 0 ? (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Exam
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Score
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Time
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentAttempts.map((attempt) => {
                                        const exam = exams.find((e) => e.id === attempt.examId);
                                        const scoreColorClass = getScoreColor(attempt.score);

                                        return (
                                            <tr key={attempt.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-gray-900">{exam?.name || "Unknown Exam"}</div>
                                                    <div className="text-xs text-gray-500">{exam?.subject || ""}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <FiCalendar className="h-4 w-4 mr-1.5 text-gray-400" />
                                                        {formatDate(attempt.date)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                                                        attempt.score >= 80 ? 'bg-green-100 text-green-800' : 
                                                        attempt.score >= 60 ? 'bg-blue-100 text-blue-800' : 
                                                        attempt.score >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {attempt.score}%
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <FiClock className="h-4 w-4 mr-1.5 text-gray-400" />
                                                        {attempt.timeSpent} minutes
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button 
                                                        onClick={() => router.push(`/results/${attempt.id}`)} 
                                                        className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
                                                    >
                                                        <FiEye className="h-4 w-4 mr-1" />
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
                        <div className="py-12 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center text-center border border-gray-100">
                            <div className="p-4 rounded-full bg-gray-100 mb-4">
                                <FiClock className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-700 mb-2">No attempts yet</h3>
                            <p className="text-gray-500 max-w-md">Start taking exams to see your recent attempts here.</p>
                        </div>
                    )}
                </div>

                {/* Bookmarked Questions */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Bookmarked Questions</h2>
                        <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View All</button>
                    </div>

                    {recentBookmarks.length > 0 ? (
                        <div className="space-y-4">
                            {recentBookmarks.map((bookmark) => (
                                <div key={bookmark.id} className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-yellow-400">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-800 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
                                                {bookmark.examName}
                                            </span>
                                            {/* {bookmark.question.year && 
                                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full border border-yellow-200">
                                                    {bookmark.question.year}
                                                </span>
                                            } */}
                                        </div>
                                        <button 
                                            onClick={() => removeBookmarkedQuestion(bookmark.id)} 
                                            className="text-yellow-500 hover:text-yellow-600 p-1.5 bg-yellow-50 rounded-full border border-yellow-200"
                                        >
                                            <FiBookmark className="h-4 w-4 fill-yellow-500" />
                                        </button>
                                    </div>
                                    <p className="text-gray-800 font-medium mb-3">{bookmark.question}</p>
                                    <div className="text-sm text-green-600 font-medium flex items-center">
                                        <FiCheck className="h-4 w-4 mr-1.5" />
                                        <span>Correct answer: </span>
                                        <span className="ml-1">{bookmark.correct_answer}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center text-center border border-gray-100">
                            <div className="p-4 rounded-full bg-gray-100 mb-4">
                                <FiBookmark className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-700 mb-2">No bookmarked questions</h3>
                            <p className="text-gray-500 max-w-md">Bookmark questions during exams to review them later.</p>
                        </div>
                    )}
                </div>

                {/* Create Exam Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-auto p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Create New Exam</h2>
                                <button 
                                    onClick={() => setShowCreateModal(false)} 
                                    className="text-gray-500 hover:text-gray-700 p-1.5 bg-gray-100 rounded-full"
                                >
                                    <FiX className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="mb-6">
                                    <div className="mb-5">
                                        <label htmlFor="examName" className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Exam Name
                                        </label>
                                        <input
                                            id="examName"
                                            placeholder="Enter exam name"
                                            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                                errors.name ? "border-red-300 bg-red-50" : "border-gray-300"
                                            }`}
                                            {...register("name")}
                                        />
                                        {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name.message}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                                        <div>
                                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Subject
                                            </label>
                                            <input
                                                id="subject"
                                                placeholder="e.g. History"
                                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                                    errors.subject ? "border-red-300 bg-red-50" : "border-gray-300"
                                                }`}
                                                {...register("subject")}
                                            />
                                            {errors.subject && <p className="mt-1.5 text-sm text-red-600">{errors.subject.message}</p>}
                                        </div>

                                        <div>
                                            <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Time Limit (minutes)
                                            </label>
                                            <input
                                                type="number"
                                                id="timeLimit"
                                                placeholder="e.g. 60"
                                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                                    errors.timeLimit ? "border-red-300 bg-red-50" : "border-gray-300"
                                                }`}
                                                {...register("timeLimit", { valueAsNumber: true })}
                                            />
                                            {errors.timeLimit && <p className="mt-1.5 text-sm text-red-600">{errors.timeLimit.message}</p>}
                                        </div>
                                    </div>

                                    <div className="mb-5">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="block text-sm font-medium text-gray-700">Upload Questions (JSON)</label>
                                            {importedQuestions.length > 0 && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowAnswers(!showAnswers)}
                                                    className="text-xs flex items-center text-indigo-600 hover:text-indigo-800"
                                                >
                                                    {showAnswers ? (
                                                        <>
                                                            <FiEyeOff className="h-3.5 w-3.5 mr-1" />
                                                            Hide Answers
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiEye className="h-3.5 w-3.5 mr-1" />
                                                            Show Answers
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                        <div
                                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer bg-gray-50"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <FiUpload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                                            <p className="text-gray-700 mb-2">Drag and drop your JSON file here</p>
                                            <p className="text-gray-500 text-sm mb-3">or</p>
                                            <button 
                                                type="button" 
                                                className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-all inline-block font-medium"
                                            >
                                                Browse Files
                                            </button>
                                            <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleFileUpload} />
                                            {importedQuestions.length > 0 && (
                                                <p className="mt-3 text-sm text-green-600 font-medium">
                                                    <FiCheck className="inline h-4 w-4 mr-1" />
                                                    {importedQuestions.length} questions loaded successfully
                                                </p>
                                            )}
                                            {importError && (
                                                <p className="mt-3 text-sm text-red-600 font-medium">
                                                    <FiAlertCircle className="inline h-4 w-4 mr-1" />
                                                    {importError}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {importedQuestions.length > 0 && (
                                        <div className="mb-5">
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preview</label>
                                            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
                                                <div className="text-sm text-gray-700">
                                                    {importedQuestions.map((q, i) => (
                                                        <div key={i} className="mb-4 pb-4 border-b border-gray-200 last:border-0">
                                                            <p className="font-medium text-gray-900">
                                                                {i + 1}. {q.question}
                                                            </p>
                                                            <div className="ml-5 mt-2 text-gray-600 space-y-1">
                                                                <p>A. {q.option_1}</p>
                                                                <p>B. {q.option_2}</p>
                                                                <p>C. {q.option_3}</p>
                                                                <p>D. {q.option_4}</p>
                                                                {showAnswers && (
                                                                    <p className="text-green-600 mt-2 font-medium">
                                                                        <FiCheck className="inline h-4 w-4 mr-1" />
                                                                        Correct: {q.correct_answer}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowCreateModal(false)} 
                                        className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={`px-4 py-2.5 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-all font-medium ${
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
                <div 
                    className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 transition-all transform ${
                        showToast ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                    } border ${toastType === "success" ? "border-green-100" : "border-red-100"} max-w-md`}
                >
                    <div className="flex items-center">
                        <div className={`flex-shrink-0 mr-3 p-2 rounded-full ${
                            toastType === "success" ? "bg-green-100" : "bg-red-100"
                        }`}>
                            {toastType === "success" ? 
                                <FiCheck className="h-5 w-5 text-green-500" /> : 
                                <FiAlertCircle className="h-5 w-5 text-red-500" />
                            }
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{toastMessage}</p>
                        </div>
                        <button 
                            onClick={() => setShowToast(false)}
                            className="ml-auto p-1 text-gray-400 hover:text-gray-600"
                        >
                            <FiX className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}