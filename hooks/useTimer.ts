import { useEffect, useRef } from 'react';
import { useExamStore } from '@/store/examStore';

export const useTimer = () => {
    const {
        timeRemaining,
        setTimeRemaining,
        submitExam,
        currentScreen
    } = useExamStore();

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (currentScreen === 'exam') {
            timerRef.current = setInterval(() => {
                setTimeRemaining(timeRemaining - 1);
            }, 1000);

            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            };
        }
    }, [timeRemaining, currentScreen, setTimeRemaining]);

    useEffect(() => {
        if (timeRemaining <= 0 && currentScreen === 'exam') {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            submitExam();
        }
    }, [timeRemaining, currentScreen, submitExam]);

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getTimerStatus = (): 'normal' | 'warning' | 'danger' => {
        if (timeRemaining <= 60) return 'danger';
        if (timeRemaining <= 300) return 'warning';
        return 'normal';
    };

    return {
        time: timeRemaining,
        formattedTime: formatTime(timeRemaining),
        status: getTimerStatus(),
    };
};