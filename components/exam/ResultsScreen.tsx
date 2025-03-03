import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { useExamStore } from "@/store/examStore";

const ResultsScreen: React.FC = () => {
    const { examData, results, userAnswers, skippedQuestions, questionTimes, retakeExam } = useExamStore();

    const statusChartRef = useRef<HTMLCanvasElement>(null);
    const timeChartRef = useRef<HTMLCanvasElement>(null);
    const categoryChartRef = useRef<HTMLCanvasElement>(null);

    const chartInstancesRef = useRef<{
        statusChart?: Chart;
        timeChart?: Chart;
        categoryChart?: Chart;
    }>({});

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
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    plugins: {
                        legend: {
                            position: "right",
                            labels: {
                                font: { family: "Inter", size: 12 },
                                padding: 20,
                            },
                        },
                        title: {
                            display: true,
                            text: "Question Performance",
                            font: {
                                family: "Inter",
                                size: 14,
                                weight: "bold",
                            },
                            padding: {
                                bottom: 20,
                            },
                        },
                    },
                },
            });
        }

        // Time Analysis Chart
        if (timeChartRef.current) {
            const questionLabels = Array.from({ length: examData.questions.length }, (_, i) => `Q${i + 1}`);

            chartInstancesRef.current.timeChart = new Chart(timeChartRef.current, {
                type: "bar",
                data: {
                    labels: questionLabels,
                    datasets: [
                        {
                            label: "Time Spent (seconds)",
                            data: questionTimes.map((time) => Math.round(time)),
                            backgroundColor: "rgba(59, 130, 246, 0.6)",
                            borderColor: "rgba(59, 130, 246, 1)",
                            borderWidth: 1,
                            borderRadius: 4,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: "Time Spent per Question",
                            font: {
                                family: "Inter",
                                size: 14,
                                weight: "bold",
                            },
                            padding: {
                                bottom: 20,
                            },
                        },
                        legend: {
                            labels: {
                                font: {
                                    family: "Inter",
                                    size: 12,
                                },
                            },
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: "Seconds",
                                font: {
                                    family: "Inter",
                                    size: 12,
                                },
                            },
                            ticks: {
                                font: {
                                    family: "Inter",
                                    size: 11,
                                },
                            },
                        },
                        x: {
                            ticks: {
                                font: {
                                    family: "Inter",
                                    size: 11,
                                },
                            },
                        },
                    },
                },
            });
        }

        // Category Performance Chart
        if (categoryChartRef.current) {
            // Group questions by category and calculate performance for each
            const categories: Record<string, { total: number; correct: number }> = {};

            examData.questions.forEach((question, index) => {
                if (!categories[question.category]) {
                    categories[question.category] = { total: 0, correct: 0 };
                }

                categories[question.category].total++;

                if (userAnswers[index] === question.correct_answer) {
                    categories[question.category].correct++;
                }
            });

            const categoryLabels = Object.keys(categories);
            const categoryData = categoryLabels.map((category) => {
                const { total, correct } = categories[category];
                return (correct / total) * 100;
            });

            chartInstancesRef.current.categoryChart = new Chart(categoryChartRef.current, {
                type: "radar",
                data: {
                    labels: categoryLabels,
                    datasets: [
                        {
                            label: "Your Performance",
                            data: categoryData,
                            fill: true,
                            backgroundColor: "rgba(59, 130, 246, 0.2)",
                            borderColor: "rgba(59, 130, 246, 1)",
                            pointBackgroundColor: "rgba(59, 130, 246, 1)",
                            pointBorderColor: "#fff",
                            pointHoverBackgroundColor: "#fff",
                            pointHoverBorderColor: "rgba(59, 130, 246, 1)",
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    elements: {
                        line: {
                            borderWidth: 2,
                        },
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: "Performance by Category",
                            font: {
                                family: "Inter",
                                size: 14,
                                weight: "bold",
                            },
                            padding: {
                                bottom: 20,
                            },
                        },
                    },
                    scales: {
                        r: {
                            angleLines: {
                                display: true,
                            },
                            suggestedMin: 0,
                            suggestedMax: 100,
                            ticks: {
                                stepSize: 20,
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
    }, [results, examData, questionTimes, userAnswers]);

    if (!results) return null;

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
            <div className="p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Exam Results</h2>
                            <p className="text-gray-600">Here's how you performed on the Business Budgeting exam</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-blue-50 p-6 text-center rounded-lg">
                                <div className="text-blue-600 text-lg font-medium mb-1">Score</div>
                                <div className="text-3xl font-bold text-gray-800">
                                    {results.score}/{results.maxScore}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">{results.percentage}% correct</div>
                            </div>

                            <div className="bg-green-50 p-6 text-center rounded-lg">
                                <div className="text-green-600 text-lg font-medium mb-1">Time</div>
                                <div className="text-3xl font-bold text-gray-800">{formatTime(results.timeSpent)}</div>
                                <div className="text-sm text-gray-500 mt-1">Minutes spent</div>
                            </div>

                            <div className="bg-purple-50 p-6 text-center rounded-lg">
                                <div className="text-purple-600 text-lg font-medium mb-1">Mastery</div>
                                <div className="text-3xl font-bold text-gray-800">{results.masteryLevel}</div>
                                <div className="text-sm text-gray-500 mt-1">Keep it up!</div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">Overall Performance</span>
                                <span className="text-sm font-medium text-gray-700">{results.percentage}%</span>
                            </div>
                            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-2.5 rounded-full ${
                                        results.percentage >= 80 ? "bg-green-600" : results.percentage >= 60 ? "bg-blue-600" : results.percentage >= 40 ? "bg-yellow-500" : "bg-red-600"
                                    }`}
                                    style={{ width: `${results.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Charts */}
                    <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6">Performance Analysis</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Question Status Chart */}
                            <div className="h-60">
                                <canvas ref={statusChartRef}></canvas>
                            </div>

                            {/* Time Analysis Chart */}
                            <div className="h-60">
                                <canvas ref={timeChartRef}></canvas>
                            </div>
                        </div>

                        {/* Category Performance Chart */}
                        <div className="h-60 mt-8">
                            <canvas ref={categoryChartRef}></canvas>
                        </div>
                    </div>

                    {/* Detailed Question Analysis */}
                    <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6">Question Analysis</h3>

                        <div className="space-y-6">
                            {examData.questions.map((question, index) => {
                                const isSkipped = skippedQuestions[index];
                                const isCorrect = !isSkipped && userAnswers[index] === question.correct_answer;
                                const isIncorrect = !isSkipped && userAnswers[index] !== null && userAnswers[index] !== question.correct_answer;

                                const borderColorClass = isCorrect ? "border-green-500" : isSkipped ? "border-yellow-500" : "border-red-500";
                                const bgColorClass = isCorrect ? "bg-green-50" : isSkipped ? "bg-yellow-50" : "bg-red-50";

                                return (
                                    <div key={index} className={`border-l-4 ${borderColorClass} ${bgColorClass} p-5 rounded-r-md`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="text-md font-medium text-gray-800">Question {index + 1}</h4>
                                            <div className="flex items-center space-x-3">
                                                <span className="text-sm text-gray-500">{Math.round(questionTimes[index])} seconds</span>
                                                <span
                                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                        isCorrect ? "bg-green-100 text-green-800" : isSkipped ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {isCorrect ? "Correct" : isSkipped ? "Skipped" : "Incorrect"}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-gray-700 mb-4">{question.question}</p>
                                        <div className="space-y-2 text-sm">
                                            {!isSkipped && (
                                                <div className="flex items-start">
                                                    <span className="font-medium text-gray-700 mr-2 min-w-[100px]">Your answer:</span>
                                                    <span className={`font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}>{userAnswers[index] || "Not answered"}</span>
                                                </div>
                                            )}
                                            {(isIncorrect || isSkipped) && (
                                                <div className="flex items-start">
                                                    <span className="font-medium text-gray-700 mr-2 min-w-[100px]">Correct answer:</span>
                                                    <span className="text-green-600 font-medium">{question.correct_answer}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <button
                            onClick={retakeExam}
                            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all mr-4"
                        >
                            Retake Exam
                        </button>

                        <button
                            onClick={retakeExam} // In a real app, this would navigate back to the course
                            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
                        >
                            Back to Course
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultsScreen;
