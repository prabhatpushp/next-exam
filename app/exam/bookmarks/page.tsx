import { useDashboardStore } from "@/store/dashboardStore";
import { FiBookmark, FiCheck } from "react-icons/fi";

const BookmarksPage = () => {
    const { bookmarkedQuestions, removeBookmarkedQuestion } = useDashboardStore();
    return (
        <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Bookmarked Questions</h2>
            <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View All</button>
        </div>

        {bookmarkedQuestions.length > 0 ? (
            <div className="space-y-4">
                {bookmarkedQuestions.map((bookmark) => (
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
        </div>)
};

export default BookmarksPage;
