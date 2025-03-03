import React, { useEffect } from "react";
import { useExamStore } from "@/store/examStore";

const StartScreen: React.FC = () => {
    const { examData, startExam, sidebarVisible } = useExamStore();

    useEffect(() => {
        if (!sidebarVisible) {
            // Logic to handle sidebar visibility if needed
        }
    }, [sidebarVisible]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm">
                <div className="text-center">
                    <img src="https://cdn-icons-png.flaticon.com/512/5332/5332922.png" alt="Exam illustration" className="w-40 h-40 mx-auto mb-6 object-contain" />

                    <h2 className="text-2xl font-bold text-gray-800 mb-3">Ready for exam</h2>

                    <p className="text-gray-600 mb-6">Test yourself on the skills in this course and earn mastery points for what you already know!</p>

                    <div className="flex justify-center space-x-8 mb-8 text-sm text-gray-500">
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-semibold text-gray-800 mb-1">{examData.questions.length}</span>
                            <span>Questions</span>
                        </div>
                        <div className="h-12 w-px bg-gray-200"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-semibold text-gray-800 mb-1">{examData.timeLimit}</span>
                            <span>Minutes</span>
                        </div>
                    </div>

                    <button
                        onClick={startExam}
                        className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                    >
                        Let's start
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StartScreen;
