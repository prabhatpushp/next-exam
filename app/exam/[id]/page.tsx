"use client"
import { useDashboardStore } from '@/store/dashboardStore';
import { notFound, useParams } from 'next/navigation'
import { useEffect, useState } from 'react';
import { FiMenu, FiClock, FiArrowLeft, FiArrowRight, FiCheck, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { useExamStore } from "@/store/examStore";
import { useTimer } from "@/hooks/useTimer";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import StartScreen from "@/components/exam/StartScreen";
import ExamContent from "@/components/exam/ExamContent";
import ResultsScreen from "@/components/exam/ResultsScreen";
import Sidebar from "@/components/exam/Sidebar";
import Header from "@/components/exam/Header";
import { Exam } from '@/types/examTypes';
export default function Page() {

    const { id } =  useParams<{ id: string }>()
    const { exams } = useDashboardStore();
    const [loading, setLoading] = useState(true);
    const exam = exams.find(exam => exam.id === id);

    useEffect(() => {
        if (exams.length > 0 && exam) {
            setLoading(false);
        }
    }, [exams, exam]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if(!exam) {
        notFound()
    }

    return <ExamPage id={id} exam={exam} /> ;
  }


 function ExamPage({id, exam}: {id: string, exam: Exam}) {
    const { currentScreen, initExam, toggleSidebar, sidebarVisible } = useExamStore();

    useEffect(() => {
        // Initialize exam data on mount
        initExam(exam);
    }, [initExam]);

    return (
        <div className="flex h-screen bg-gray-100 relative">

            {/* Main Container */}
            <div className="flex flex-1 flex-col overflow-y-auto">
                {/* Sidebar */}
                    <Header />

                {/* Main Content */}
                <div className="flex-1 flex">

                <Sidebar visible={sidebarVisible} />

                    {currentScreen === "start" && <StartScreen />}
                    {currentScreen === "exam" && <ExamContent />}
                    {currentScreen === "results" && <ResultsScreen />}
                   
                </div>
            </div>
        </div>
    );
}
