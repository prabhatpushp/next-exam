import React from "react";
import { FiChevronDown, FiX } from "react-icons/fi";
import { useExamStore } from "@/store/examStore";

interface SidebarProps {
    visible: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ visible }) => {
    const { sidebarData, toggleSidebar } = useExamStore();

    return (
        <div className={`sidebar bg-white w-64 flex-shrink-0 h-screen overflow-y-auto transition-all duration-300 ease-in-out transform ${visible ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="p-5">
                <div className="flex items-center mb-5">
                    <button onClick={() => toggleSidebar(false)} className="text-gray-400 hover:text-gray-600 mr-3">
                        <FiX className="h-5 w-5" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-800">How to Budget and Forecast for Your Business</h1>
                </div>

                <div className="flex items-center mb-5">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-3">BG</div>
                    <span className="text-sm font-medium text-gray-700">Bonnie Green</span>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-green-500 font-medium">66% completed</span>
                        <span className="text-gray-500">12m</span>
                    </div>
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-1 bg-green-500 rounded-full" style={{ width: "66%" }}></div>
                    </div>
                </div>

                {/* Course Sections */}
                <div className="space-y-1">
                    {sidebarData.sections.map((section: any) => (
                        <div key={section.id} className="sidebar-item p-2.5 flex items-center justify-between">
                            <div className="flex items-center">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${section.completed ? "bg-green-500 text-white" : "bg-white border border-gray-300"}`}>
                                    {section.completed && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                </div>
                                <span className={`text-sm ${section.active ? "text-blue-600 font-medium" : "text-gray-700"}`}>{section.title}</span>
                            </div>
                            {section.expandable && <FiChevronDown className="h-4 w-4 text-gray-400" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
