import React from "react";
import { useExamStore } from "@/store/examStore";

const Header: React.FC = () => {
    const { examData, currentScreen } = useExamStore();

    return (
        <div className="header bg-white border-b border-gray-200 h-14 flex items-center px-6">
            <div className="text-sm text-gray-600 font-medium">{currentScreen === "exam" || currentScreen === "results" ? `Lesson 30 of 33` : `Lesson 30 of 33`}</div>
            <div className="ml-auto">
                <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors font-medium">Next Lesson</button>
            </div>
        </div>
    );
};

export default Header;
