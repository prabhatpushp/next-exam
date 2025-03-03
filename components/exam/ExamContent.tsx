import React from "react";
import { FiArrowLeft, FiArrowRight, FiCheck, FiClock, FiSkipForward } from "react-icons/fi";
import { useExamStore } from "@/store/examStore";
import { useTimer } from "@/hooks/useTimer";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import PaginationDots from "./PaginationDots";
import QuestionOption from "./QuestionOption";

const ExamContent: React.FC = () => {
    const { examData, currentQuestion, userAnswers, skippedQuestions, navigateToQuestion, submitAnswer, skipQuestion, submitExam } = useExamStore();

    const { formattedTime, status: timerStatus } = useTimer();
    const { elapsedTime } = useQuestionTimer();

    const question = examData.questions[currentQuestion];
    const isLastQuestion = currentQuestion === examData.questions.length - 1;
    const isFirstQuestion = currentQuestion === 0;
    const hasAnswer = userAnswers[currentQuestion] !== null || skippedQuestions[currentQuestion];

    return (
        <div className="flex-1 flex flex-col">
            <div className="flex justify-center py-4 bg-gray-50 border-b border-gray-200">
                <PaginationDots />
            </div>

            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center">
                    <span className="font-medium text-gray-800 mr-1">{currentQuestion + 1}</span>
                    <span className="text-gray-500">of</span>
                    <span className="font-medium text-gray-800 ml-1">{examData.questions.length}</span>
                </div>

                <div className={`flex items-center ${timerStatus === "warning" ? "text-yellow-500" : timerStatus === "danger" ? "text-red-500 animate-pulse" : "text-gray-700"}`}>
                    <FiClock className="h-5 w-5 mr-1.5" />
                    <span className="font-medium">{formattedTime}</span>
                </div>
            </div>

            <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
                <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
                    <div className="text-sm text-gray-500 mb-3 font-medium">Multiple choice</div>

                    <h2 className="text-xl font-semibold text-gray-800 mb-6">{question.question}</h2>

                    <div className="text-sm text-gray-600 mb-6">
                        Time spent on this question: <span>{elapsedTime}</span> seconds
                    </div>

                    <form>
                        <div className="space-y-3">
                            {question.options.map((option, index) => (
                                <QuestionOption
                                    key={index}
                                    option={option}
                                    isSelected={userAnswers[currentQuestion] === option}
                                    isSkipped={skippedQuestions[currentQuestion]}
                                    onSelect={() => submitAnswer(option)}
                                />
                            ))}
                        </div>

                        <div className="mt-8 flex justify-between items-center">
                            <button
                                type="button"
                                onClick={() => navigateToQuestion(currentQuestion - 1)}
                                className={`px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md font-medium shadow-sm transition-all flex items-center ${
                                    isFirstQuestion ? "hidden" : ""
                                }`}
                            >
                                <FiArrowLeft className="h-4 w-4 mr-1.5" />
                                Previous
                            </button>

                            <button
                                type="button"
                                onClick={skipQuestion}
                                className="px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-md font-medium shadow-sm transition-all flex items-center"
                            >
                                <FiSkipForward className="h-4 w-4 mr-1.5" />
                                Skip Question
                            </button>

                            {!isLastQuestion ? (
                                <button
                                    type="button"
                                    onClick={() => navigateToQuestion(currentQuestion + 1)}
                                    disabled={!hasAnswer}
                                    className={`px-5 py-2.5 rounded-md font-medium shadow-sm transition-all flex items-center ml-auto ${
                                        hasAnswer ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                                >
                                    Next
                                    <FiArrowRight className="h-4 w-4 ml-1.5" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={submitExam}
                                    className="px-5 py-2.5 bg-green-600 text-white rounded-md font-medium shadow-sm hover:bg-green-700 transition-all flex items-center ml-auto"
                                >
                                    Submit Exam
                                    <FiCheck className="h-4 w-4 ml-1.5" />
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ExamContent;
