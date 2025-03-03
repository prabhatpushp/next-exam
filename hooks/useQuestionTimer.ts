import { useState, useEffect, useRef } from 'react';
import { useExamStore } from '@/store/examStore';

export const useQuestionTimer = () => {
    const {
        currentQuestion,
        questionTimes,
        updateQuestionTime,
        currentScreen
    } = useExamStore();

    const elapsedTimeRef = useRef(questionTimes[currentQuestion] || 0);
    const [elapsedTime, setElapsedTime] = useState(elapsedTimeRef.current);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        elapsedTimeRef.current = questionTimes[currentQuestion] || 0;
        setElapsedTime(elapsedTimeRef.current);
    }, [currentQuestion, questionTimes]);

    useEffect(() => {
        if (currentScreen === 'exam') {
            timerRef.current = setInterval(() => {
                elapsedTimeRef.current += 1;
                setElapsedTime(Math.round(elapsedTimeRef.current));
                updateQuestionTime(elapsedTimeRef.current);
            }, 1000);

            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            };
        }
    }, [currentScreen, updateQuestionTime]);

    return {
        elapsedTime: Math.round(elapsedTime),
    };
};
