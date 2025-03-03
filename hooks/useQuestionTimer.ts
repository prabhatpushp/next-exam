import { useState, useEffect, useRef } from 'react';
import { useExamStore } from '@/store/examStore';

export const useQuestionTimer = () => {
    const {
        currentQuestion,
        questionTimes,
        updateQuestionTime,
        currentScreen
    } = useExamStore();

    const [elapsedTime, setElapsedTime] = useState(questionTimes[currentQuestion] || 0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setElapsedTime(questionTimes[currentQuestion] || 0);
    }, [currentQuestion, questionTimes]);

    useEffect(() => {
        if (currentScreen === 'exam') {
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => {
                    const newTime = prev + 1;
                    updateQuestionTime(newTime);
                    return newTime;
                });
            }, 1000);

            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            };
        }
    }, [currentQuestion, currentScreen, updateQuestionTime]);

    return {
        elapsedTime: Math.round(elapsedTime),
    };
};
