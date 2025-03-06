import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { useExamStore } from "@/store/examStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { BookmarkedQuestion, Question } from "@/types/examTypes";
import { FaCheck, FaTimes, FaBookmark, FaRegBookmark, FaRedo, FaArrowLeft, FaClock, FaChartBar, FaRegClock, FaRegCheckCircle } from "react-icons/fa";
import MarkdownContent from "./MarkdownContent";
import Link from "next/link";
const ResultsScreen: React.FC = () => {
    const { examData, results, userAnswers, skippedQuestions, questionTimes, retakeExam } = useExamStore();
    const { addBookmarkedQuestion, removeBookmarkedQuestion, bookmarkedQuestions, addAttempt } = useDashboardStore();

    // State to track bookmarked questions locally
    const [bookmarkedState, setBookmarkedState] = useState<Record<string, boolean>>({});

    const statusChartRef = useRef<HTMLCanvasElement>(null);
    const timeChartRef = useRef<HTMLCanvasElement>(null);

    const chartInstancesRef = useRef<{
        statusChart?: Chart;
        timeChart?: Chart;
    }>({});

    // Initialize bookmarked state from store
    useEffect(() => {
        if (bookmarkedQuestions && examData) {
            const initialState: Record<string, boolean> = {};
            examData.questions.forEach((question) => {
                initialState[question.id] = bookmarkedQuestions.some((bq) => bq.questionId === question.id);
            });
            setBookmarkedState(initialState);
        }
    }, [bookmarkedQuestions, examData]);

    useEffect(() => {
        if (!results) return;

        // Clear previous charts
        Object.values(chartInstancesRef.current).forEach((chart) => chart?.destroy());

        // Question Status Chart
        if (statusChartRef.current) {
            chartInstancesRef.current.statusChart = new Chart(statusChartRef.current, {
                type: "doughnut",
                data: {
                    labels: ["Correct", "Incorrect", "Skipped"],
                    datasets: [
                        {
                            data: [results.correctCount, results.incorrectCount, results.skippedCount],
                            backgroundColor: ["#10b981", "#ef4444", "#f59e0b"],
                            borderWidth: 0,
                            hoverOffset: 5,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "75%",
                    plugins: {
                        legend: {
                            display: false,
                        },
                        tooltip: {
                            padding: 12,
                            backgroundColor: "rgba(17, 24, 39, 0.9)",
                            titleFont: {
                                size: 14,
                                weight: "bold",
                            },
                            bodyFont: {
                                size: 13,
                            },
                            callbacks: {
                                label: function (context) {
                                    const value = context.raw as number;
                                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0) as number;
                                    const percentage = Math.round((value / total) * 100);
                                    return `${context.label}: ${value} (${percentage}%)`;
                                },
                            },
                        },
                    },
                },
            });
        }

        // Time Analysis Chart - Fixed to show correct time values
        if (timeChartRef.current) {
            const questionLabels = Array.from({ length: examData.questions.length }, (_, i) => `Q${i + 1}`);

            chartInstancesRef.current.timeChart = new Chart(timeChartRef.current, {
                type: "bar",
                data: {
                    labels: questionLabels,
                    datasets: [
                        {
                            label: "Time (seconds)",
                            data: questionTimes,
                            backgroundColor: (context) => {
                                const index = context.dataIndex;
                                const isCorrect = userAnswers[index] === examData.questions[index].correct_answer;
                                const isSkipped = skippedQuestions[index];

                                if (isSkipped) return "rgba(245, 158, 11, 0.7)";
                                return isCorrect ? "rgba(16, 185, 129, 0.7)" : "rgba(239, 68, 68, 0.7)";
                            },
                            borderColor: (context) => {
                                const index = context.dataIndex;
                                const isCorrect = userAnswers[index] === examData.questions[index].correct_answer;
                                const isSkipped = skippedQuestions[index];

                                if (isSkipped) return "rgb(245, 158, 11)";
                                return isCorrect ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)";
                            },
                            borderWidth: 1,
                            borderRadius: 6,
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
                            backgroundColor: "rgba(17, 24, 39, 0.9)",
                            titleFont: {
                                size: 14,
                                weight: "bold",
                            },
                            bodyFont: {
                                size: 13,
                            },
                            callbacks: {
                                title: function (tooltipItems) {
                                    return `Question ${tooltipItems[0].dataIndex + 1}`;
                                },
                                label: function (context) {
                                    const index = context.dataIndex;
                                    const timeValue = context.raw as number;
                                    const isCorrect = userAnswers[index] === examData.questions[index].correct_answer;
                                    const isSkipped = skippedQuestions[index];

                                    let status = "";
                                    if (isSkipped) status = "• Skipped";
                                    else status = isCorrect ? "• Correct" : "• Incorrect";

                                    return [`Time: ${displayTime(timeValue)}`, status];
                                },
                            },
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: "Time (seconds)",
                                font: {
                                    family: "'Inter', sans-serif",
                                    size: 12,
                                    weight: 500,
                                },
                                color: "#64748b",
                            },
                            ticks: {
                                font: {
                                    family: "'Inter', sans-serif",
                                    size: 11,
                                },
                                color: "#94a3b8",
                                callback: function (value) {
                                    return value + "s";
                                },
                            },
                            grid: {
                                color: "rgba(0, 0, 0, 0.05)",
                            },
                        },
                        x: {
                            ticks: {
                                font: {
                                    family: "'Inter', sans-serif",
                                    size: 11,
                                },
                                color: "#94a3b8",
                            },
                            grid: {
                                display: false,
                            },
                        },
                    },
                },
            });
        }

        return () => {
            // Cleanup charts on unmount
            Object.values(chartInstancesRef.current).forEach((chart) => chart?.destroy());
        };
    }, [results, examData, questionTimes, userAnswers, skippedQuestions]);

    useEffect(() => {
        if (results) {
            // Prepare the attempt data
            const attemptData = {
                id: `attempt-${Date.now()}`, // Unique ID for the attempt
                examId: examData.id,
                date: Date.now(),
                score: results.percentage,
                timeSpent: questionTimes.reduce((sum, time) => sum + time, 0), // Total time spent
                answeredQuestions: results.correctCount + results.incorrectCount,
                totalQuestions: examData.questions.length,
                submittedAnswers: examData.questions.map((question, index) => ({
                    questionId: question.id,
                    answer: userAnswers[index] || null,
                })),
            };

            // Add the attempt to the dashboard store
            addAttempt(attemptData);
        }
    }, [results]);

    if (!results) return null;

    // Utility function to display time in the most appropriate format
    const displayTime = (seconds: number) => {
        if (seconds < 60) {
            return `${Math.round(seconds)}s`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.round(seconds % 60);
            return `${minutes}m ${remainingSeconds}s`;
        }
    };

    // Calculate accuracy correctly
    const calculateAccuracy = () => {
        const total = results.correctCount + results.incorrectCount;
        if (total === 0) return 0;
        return Math.round((results.correctCount / total) * 100);
    };

    const toggleBookmark = (question: Question) => {
        const isCurrentlyBookmarked = bookmarkedState[question.id] || false;

        // Update local state immediately for responsive UI
        setBookmarkedState((prev) => ({
            ...prev,
            [question.id]: !isCurrentlyBookmarked,
        }));

        if (isCurrentlyBookmarked) {
            // Remove from bookmarks
            removeBookmarkedQuestion(question.id);
        } else {
            // Add to bookmarks
            const bookmarkedQuestion: BookmarkedQuestion = {
                id: question.id,
                examId: examData.id,
                examName: examData.name,
                questionId: question.id,
                question: question.question,
                options: question.options,
                correct_answer: question.correct_answer,
                bookmarkedAt: Date.now(),
            };
            addBookmarkedQuestion(bookmarkedQuestion);
        }
    };

    // Calculate average time per question
    const calculateAverageTime = () => {
        if (!questionTimes.length) return 0;
        return questionTimes.reduce((sum, time) => sum + time, 0) / questionTimes.length;
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
            <div className="p-4 sm:p-6">
                <div className="max-w-5xl mx-auto">
                    {/* Combined Results & Analysis Section */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
                        {/* Header with gradient - more compact and polished */}
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 py-5 px-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{examData.name}</h2>
                                    <div className="flex items-center mt-1 text-indigo-100 text-xs">
                                        <FaRegClock className="mr-1" size={12} />
                                        <span>Completed on {new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-white">{results.percentage}%</div>
                                        <div className="text-indigo-100 text-xs uppercase tracking-wider">Score</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Performance stats and charts - beautifully organized */}
                        <div className="p-6">
                            {/* Stats Cards - more compact and beautiful */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-white rounded-lg p-4 flex items-center shadow-sm border border-slate-100">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600 mr-3">
                                        <FaChartBar size={16} />
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs font-medium">Score</div>
                                        <div className="text-lg font-bold text-slate-800">
                                            {results.score}/{results.maxScore}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-4 flex items-center shadow-sm border border-slate-100">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 mr-3">
                                        <FaClock size={16} />
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs font-medium">Time Spent</div>
                                        <div className="text-lg font-bold text-slate-800">{displayTime(results.timeSpent)}</div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-4 flex items-center shadow-sm border border-slate-100">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-600 mr-3">
                                        <FaRegCheckCircle size={16} />
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs font-medium">Accuracy</div>
                                        <div className="text-lg font-bold text-slate-800">{calculateAccuracy()}%</div>
                                    </div>
                                </div>
                            </div>

                            {/* Beautiful Performance Charts Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {/* Question Status Chart */}
                                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-medium text-slate-800 flex items-center">
                                            <FaRegCheckCircle className="mr-2 text-indigo-600" size={14} />
                                            Results Breakdown
                                        </h3>
                                    </div>

                                    <div className="relative">
                                        <div className="h-52">
                                            <canvas ref={statusChartRef}></canvas>
                                        </div>

                                        {/* Center text inside doughnut */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <div className="text-3xl font-bold text-slate-800">{results.percentage}%</div>
                                            <div className="text-xs text-slate-500">Overall Score</div>
                                        </div>
                                    </div>

                                    {/* Unified legend */}
                                    <div className="mt-3 flex justify-center space-x-4 text-xs">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                                            <span className="text-slate-600">Correct ({results.correctCount})</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                                            <span className="text-slate-600">Incorrect ({results.incorrectCount})</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
                                            <span className="text-slate-600">Skipped ({results.skippedCount})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Time Analysis Chart */}
                                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-medium text-slate-800 flex items-center">
                                            <FaClock className="mr-2 text-indigo-600" size={14} />
                                            Time per Question
                                        </h3>
                                        <div className="text-xs text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded-md">Avg: {displayTime(calculateAverageTime())}</div>
                                    </div>
                                    <div className="h-60">
                                        <canvas ref={timeChartRef}></canvas>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-4 justify-center">
                                <button
                                    onClick={retakeExam}
                                    className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all flex items-center justify-center"
                                >
                                    <FaRedo className="mr-2" size={14} />
                                    Retake Exam
                                </button>
                                <Link href={"/"}>
                                    <button
                                        onClick={retakeExam} // In a real app, this would navigate back to the course
                                        className="px-5 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 transition-all flex items-center justify-center"
                                    >
                                        <FaArrowLeft className="mr-2" size={14} />
                                        Back to Course
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Question Analysis */}
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                            <FaChartBar className="mr-2 text-indigo-600" />
                            Question Analysis
                        </h3>

                        <div className="space-y-4">
                            {examData.questions.map((question, index) => {
                                const isSkipped = skippedQuestions[index];
                                const isCorrect = !isSkipped && userAnswers[index] === question.correct_answer;
                                const isIncorrect = !isSkipped && userAnswers[index] !== null && userAnswers[index] !== question.correct_answer;
                                const isBookmarked = bookmarkedState[question.id] || false;

                                return (
                                    <div key={index} className="border border-slate-200 rounded-lg overflow-hidden transition-all hover:shadow-md">
                                        <div
                                            className={`p-4 flex justify-between items-center ${
                                                isCorrect ? "bg-green-50 border-b border-green-100" : isSkipped ? "bg-amber-50 border-b border-amber-100" : "bg-red-50 border-b border-red-100"
                                            }`}
                                        >
                                            <div className="flex items-center">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                                        isCorrect ? "bg-green-100 text-green-600" : isSkipped ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                                                    }`}
                                                >
                                                    {isCorrect ? <FaCheck className="text-sm" /> : isSkipped ? <FaClock className="text-sm" /> : <FaTimes className="text-sm" />}
                                                </div>
                                                <h4 className="font-medium text-slate-800">Question {index + 1}</h4>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                {/* Fixed time display */}
                                                <span className="text-sm text-slate-500 flex items-center">
                                                    <FaClock className="mr-1 text-slate-400" size={14} />
                                                    {displayTime(questionTimes[index])}
                                                </span>

                                                {/* Enhanced Bookmark Toggle Button */}
                                                <button
                                                    onClick={() => toggleBookmark(question)}
                                                    className={`relative group transition-all duration-200 ${
                                                        isBookmarked ? "bg-indigo-100 text-indigo-600 hover:bg-indigo-200" : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                                                    } w-9 h-9 rounded-full flex items-center justify-center shadow-sm overflow-hidden`}
                                                    title={isBookmarked ? "Remove bookmark" : "Bookmark question"}
                                                >
                                                    {isBookmarked ? (
                                                        <>
                                                            <FaBookmark className="text-indigo-600 z-10" size={14} />
                                                            <span className="absolute inset-0 bg-indigo-100 transform scale-100 group-hover:scale-0 transition-transform duration-200 rounded-full"></span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaRegBookmark className="z-10" size={14} />
                                                            <span className="absolute inset-0 bg-indigo-100 transform scale-0 group-hover:scale-100 transition-transform duration-200 rounded-full"></span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <div className="text-slate-800 mb-4">
                                                <MarkdownContent content={question.question} />
                                            </div>

                                            {/* Options */}
                                            <div className="space-y-2 mb-2">
                                                {question.options.map((option, optIndex) => {
                                                    const isUserAnswer = userAnswers[index] === option;
                                                    const isCorrectAnswer = question.correct_answer === option;

                                                    let optionClass = "p-3 rounded-md flex items-start text-sm";

                                                    if (isUserAnswer && isCorrectAnswer) {
                                                        // User selected correct answer
                                                        optionClass += " bg-green-50 border border-green-200 text-green-800";
                                                    } else if (isUserAnswer && !isCorrectAnswer) {
                                                        // User selected wrong answer
                                                        optionClass += " bg-red-50 border border-red-200 text-red-800";
                                                    } else if (isCorrectAnswer) {
                                                        // Correct answer not selected by user
                                                        optionClass += " bg-green-50 border border-green-200 text-green-800";
                                                    } else {
                                                        // Normal option
                                                        optionClass += " bg-slate-50 border border-slate-200 text-slate-700";
                                                    }

                                                    return (
                                                        <div key={optIndex} className={optionClass}>
                                                            <div
                                                                className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1 ${
                                                                    isUserAnswer && isCorrectAnswer
                                                                        ? "bg-green-200"
                                                                        : isUserAnswer && !isCorrectAnswer
                                                                        ? "bg-red-200"
                                                                        : isCorrectAnswer
                                                                        ? "bg-green-200"
                                                                        : "bg-slate-200"
                                                                }`}
                                                            >
                                                                {isUserAnswer && isCorrectAnswer && <FaCheck className="text-xs text-green-700" />}
                                                                {isUserAnswer && !isCorrectAnswer && <FaTimes className="text-xs text-red-700" />}
                                                                {!isUserAnswer && isCorrectAnswer && <FaCheck className="text-xs text-green-700" />}
                                                            </div>
                                                            <MarkdownContent content={option} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultsScreen;
