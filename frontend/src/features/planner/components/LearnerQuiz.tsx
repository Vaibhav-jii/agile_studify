import React, { useState } from 'react';
import { Modal } from '../../../components/layout/Modal';
import { Button } from '../../../components/form-controls/Button';
import { Card } from '../../../components/data-display/Card';
import { Badge } from '../../../components/data-display/Badge';
import { ChevronRight, RotateCcw, Sparkles } from 'lucide-react';

interface QuizQuestion {
    question: string;
    options: { label: string; score: number }[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
    {
        question: 'How often do you need to re-read a paragraph to fully understand it?',
        options: [
            { label: 'Almost always — I need multiple reads', score: 1 },
            { label: 'Sometimes, for complex topics', score: 2 },
            { label: 'Rarely — I get it on the first read', score: 3 },
        ],
    },
    {
        question: 'After attending a lecture, how quickly can you summarize the key points?',
        options: [
            { label: 'I need time to review my notes first', score: 1 },
            { label: 'I can do it after a few minutes of thought', score: 2 },
            { label: 'Immediately — I retain most of it', score: 3 },
        ],
    },
    {
        question: 'When learning a new concept, what do you prefer?',
        options: [
            { label: 'Detailed step-by-step examples', score: 1 },
            { label: 'A mix of overview and examples', score: 2 },
            { label: 'Quick overview, then I figure it out', score: 3 },
        ],
    },
    {
        question: 'How do you feel when encountering a brand-new topic?',
        options: [
            { label: 'Overwhelmed — I need to break it down slowly', score: 1 },
            { label: 'Curious but cautious — I take a steady pace', score: 2 },
            { label: 'Excited — I dive right in and learn fast', score: 3 },
        ],
    },
    {
        question: 'How many times do you typically revise material before an exam?',
        options: [
            { label: '4 or more times', score: 1 },
            { label: '2–3 times', score: 2 },
            { label: 'Once is usually enough', score: 3 },
        ],
    },
];

type LearnerSpeed = 'slow' | 'medium' | 'fast';

interface QuizResult {
    speed: LearnerSpeed;
    emoji: string;
    title: string;
    description: string;
}

function getResult(totalScore: number): QuizResult {
    if (totalScore <= 7) {
        return {
            speed: 'slow',
            emoji: '🐢',
            title: 'Thorough Learner',
            description:
                'You prefer to take your time and deeply understand every concept. Your timetable will include extra time for careful study and revision.',
        };
    }
    if (totalScore <= 11) {
        return {
            speed: 'medium',
            emoji: '🚶',
            title: 'Balanced Learner',
            description:
                'You have a well-rounded learning style — neither rushing nor lingering too long. Your timetable will be set at a comfortable pace.',
        };
    }
    return {
        speed: 'fast',
        emoji: '🚀',
        title: 'Quick Learner',
        description:
            'You pick up concepts rapidly and need less repetition. Your timetable will be streamlined for efficiency.',
    };
}

interface LearnerQuizProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (speed: LearnerSpeed) => void;
}

export function LearnerQuiz({ isOpen, onClose, onApply }: LearnerQuizProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);

    const totalQuestions = QUIZ_QUESTIONS.length;
    const progress = ((currentQuestion) / totalQuestions) * 100;

    const handleSelect = (score: number, optionIdx: number) => {
        setSelectedOption(optionIdx);

        setTimeout(() => {
            const newAnswers = [...answers, score];
            setAnswers(newAnswers);
            setSelectedOption(null);

            if (currentQuestion < totalQuestions - 1) {
                setCurrentQuestion(currentQuestion + 1);
            } else {
                setShowResult(true);
            }
        }, 400);
    };

    const handleReset = () => {
        setCurrentQuestion(0);
        setAnswers([]);
        setSelectedOption(null);
        setShowResult(false);
    };

    const handleApply = () => {
        const result = getResult(answers.reduce((a, b) => a + b, 0));
        onApply(result.speed);
        handleReset();
        onClose();
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const totalScore = answers.reduce((a, b) => a + b, 0);
    const result = showResult ? getResult(totalScore) : null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={showResult ? 'Your Result' : 'Learning Speed Quiz'}
            size="md"
            footer={
                showResult ? (
                    <>
                        <Button variant="ghost" onClick={handleReset}>
                            <RotateCcw size={16} />
                            Retake
                        </Button>
                        <Button onClick={handleApply}>
                            <Sparkles size={16} />
                            Apply: {result?.title}
                        </Button>
                    </>
                ) : (
                    <Button variant="ghost" onClick={handleClose}>
                        Cancel
                    </Button>
                )
            }
        >
            {showResult && result ? (
                /* ── Result Screen ─────────────────────────── */
                <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-6xl mb-4">{result.emoji}</div>
                    <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                        {result.title}
                    </h3>
                    <Badge variant="info" className="mb-4">{result.speed.toUpperCase()}</Badge>
                    <p className="text-[var(--color-text-muted)] max-w-sm mx-auto leading-relaxed">
                        {result.description}
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
                        <span>Score: {totalScore}/{totalQuestions * 3}</span>
                    </div>
                </div>
            ) : (
                /* ── Question Screen ───────────────────────── */
                <div>
                    {/* Progress bar */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-[var(--color-text-muted)]">
                                Question {currentQuestion + 1} of {totalQuestions}
                            </span>
                            <span className="text-sm font-medium text-[var(--color-primary-violet)]">
                                {Math.round(progress)}%
                            </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{
                                    width: `${progress}%`,
                                    background: 'linear-gradient(90deg, var(--color-primary-violet), var(--color-accent-blue))',
                                }}
                            />
                        </div>
                    </div>

                    {/* Question */}
                    <h3
                        className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 animate-in fade-in slide-in-from-right-4 duration-300"
                        key={currentQuestion}
                    >
                        {QUIZ_QUESTIONS[currentQuestion].question}
                    </h3>

                    {/* Options */}
                    <div className="space-y-3" key={`opts-${currentQuestion}`}>
                        {QUIZ_QUESTIONS[currentQuestion].options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSelect(option.score, idx)}
                                disabled={selectedOption !== null}
                                className={`
                  w-full text-left p-4 rounded-xl border transition-all duration-300
                  animate-in fade-in slide-in-from-right-4
                  ${selectedOption === idx
                                        ? 'border-[var(--color-primary-violet)] bg-[var(--color-primary-violet)]/20 scale-[1.02]'
                                        : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 hover:scale-[1.01]'
                                    }
                  ${selectedOption !== null && selectedOption !== idx ? 'opacity-40' : ''}
                `}
                                style={{ animationDelay: `${idx * 80}ms` }}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--color-text-primary)] font-medium">
                                        {option.label}
                                    </span>
                                    <ChevronRight
                                        size={16}
                                        className={`text-[var(--color-text-muted)] transition-transform duration-200 ${selectedOption === idx ? 'translate-x-1' : ''
                                            }`}
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </Modal>
    );
}
