import React from "react";
import { useExamStore } from "@/store/examStore";
import { FiMenu } from "react-icons/fi";

const Header: React.FC = () => {
    const { examData, currentScreen, toggleSidebar } = useExamStore();

    return (
        <div className="header bg-white border-b border-gray-200 min-h-14 flex items-center ">
            <div onClick={() => toggleSidebar()} className="flex cursor-pointer items-center border-r border-gray-200 h-full p-4 mr-4 hover:bg-gray-100">
            <button  className="h-full w-full flex items-center justify-center">
                <FiMenu className="h-5 w-5 text-gray-600" />
            </button>
            </div>
            <div className="text-sm text-gray-600 font-medium">{currentScreen === "exam" || currentScreen === "results" ? `Lesson 30 of 33` : `Lesson 30 of 33`}</div>
            <div className="ml-auto">
                <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors font-medium">Next Lesson</button>
            </div>
        </div>
    );
};

export default Header;
