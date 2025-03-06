import React from "react";
import MarkdownContent from "./MarkdownContent";

interface QuestionOptionProps {
    option: string;
    isSelected: boolean;
    isSkipped: boolean;
    onSelect: () => void;
}

const QuestionOption: React.FC<QuestionOptionProps> = ({ option, isSelected, isSkipped, onSelect }) => {
    let containerClasses = "p-4 cursor-pointer border rounded-lg transition-all";

    if (isSelected) {
        containerClasses += " border-blue-500 bg-blue-50";
    } else if (isSkipped) {
        containerClasses += " border-yellow-400 bg-yellow-50";
    } else {
        containerClasses += " border-gray-200 hover:border-gray-300 hover:bg-gray-50";
    }

    return (
        <div className={containerClasses} onClick={onSelect}>
            <label className="flex items-start w-full cursor-pointer">
                <div className="relative flex items-center h-5 mt-1">
                    <input type="radio" className="opacity-0 absolute h-5 w-5" checked={isSelected} onChange={onSelect} />
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? "border-blue-500" : "border-gray-300"}`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                    </div>
                </div>
                <span className="ml-3 text-gray-700">
                    <MarkdownContent content={option} />
                </span>
            </label>
        </div>
    );
};

export default QuestionOption;
