import React from "react";
import { useExamStore } from "@/store/examStore";

const PaginationDots: React.FC = () => {
    const { examData, currentQuestion, userAnswers, skippedQuestions, navigateToQuestion } = useExamStore();

    return (
        <div className="flex space-x-2">
            {examData.questions.map((_, index) => {
                const isActive = index === currentQuestion;
                const isSkipped = skippedQuestions[index];
                const isAnswered = userAnswers[index] !== null;

                let bgColor = "bg-gray-300";
                if (isSkipped) bgColor = "bg-yellow-500";
                else if (isAnswered) bgColor = "bg-blue-600";

                return (
                    <div key={index} className={`w-2 h-2 rounded-full cursor-pointer transition-all ${bgColor} ${isActive ? "transform scale-150" : ""}`} onClick={() => navigateToQuestion(index)} />
                );
            })}
        </div>
    );
};

export default PaginationDots;
