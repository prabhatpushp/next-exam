import { useState, useEffect, useRef } from 'react';
import { useExamStore } from '@/store/examStore';

export const useQuestionTimer = () => {
    const {
        currentQuestion,
        questionTimes,
        updateQuestionTime,
        currentScreen
    } = useExamStore();

    const elapsedTimeRef = useRef(new Array(questionTimes.length).fill(0));
    const [elapsedTimes, setElapsedTimes] = useState(elapsedTimeRef.current);
    const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        // Pause the timer for the previous question
        if (timerRef.current !== undefined) {
            clearInterval(timerRef.current);
            updateQuestionTime(elapsedTimeRef.current[currentQuestion]);
        }

        // Start the timer for the current question
        timerRef.current = setInterval(() => {
            elapsedTimeRef.current[currentQuestion] += 1;
            setElapsedTimes([...elapsedTimeRef.current]);
        }, 1000);

        return () => {
            // Clear the timer on unmount or when changing questions
            clearInterval(timerRef.current);
            updateQuestionTime(elapsedTimeRef.current[currentQuestion]);
        };
    }, [currentQuestion, updateQuestionTime]);

    return {
        elapsedTimes,
    };
};
