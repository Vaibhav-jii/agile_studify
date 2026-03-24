import React, { useState, useEffect } from 'react';
import {
    Brain,
    BookOpen,
    ChevronRight,
    Clock,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Sparkles,
    Loader2,
    FileText,
    Trophy,
    Target,
    Zap,
} from 'lucide-react';
import {
    fetchSubjects,
    generateQuiz,
    type SubjectResponse,
    type QuizQuestionResponse,
} from '../../services/api';

type QuizState = 'select' | 'loading' | 'quiz' | 'results';

export function QuizView() {
    const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
    const [quizState, setQuizState] = useState<QuizState>('select');
    const [questions, setQuestions] = useState<QuizQuestionResponse[]>([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
    const [showExplanation, setShowExplanation] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<SubjectResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Load subjects
    useEffect(() => {
        fetchSubjects().then(setSubjects).catch(() => { });
    }, []);

    // Timer during quiz
    useEffect(() => {
        if (quizState !== 'quiz') return;
        const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
        return () => clearInterval(interval);
    }, [quizState]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleStartQuiz = async (subject: SubjectResponse) => {
        setSelectedSubject(subject);
        setQuizState('loading');
        setError(null);
        setCurrentQ(0);
        setSelectedAnswers([]);
        setShowExplanation(false);
        setElapsedSeconds(0);

        try {
            const qs = await generateQuiz(subject.id, 10);
            setQuestions(qs);
            setSelectedAnswers(new Array(qs.length).fill(null));
            setQuizState('quiz');
        } catch (err: any) {
            setError(err.message || 'Failed to generate quiz');
            setQuizState('select');
        }
    };

    const handleSelectAnswer = (optionIndex: number) => {
        if (selectedAnswers[currentQ] !== null) return; // already answered
        const updated = [...selectedAnswers];
        updated[currentQ] = optionIndex;
        setSelectedAnswers(updated);
        setShowExplanation(true);
    };

    const handleNext = () => {
        setShowExplanation(false);
        if (currentQ < questions.length - 1) {
            setCurrentQ(currentQ + 1);
        } else {
            setQuizState('results');
        }
    };

    const handleRetake = () => {
        if (selectedSubject) {
            handleStartQuiz(selectedSubject);
        }
    };

    const handleBackToSubjects = () => {
        setQuizState('select');
        setQuestions([]);
        setSelectedSubject(null);
        setError(null);
    };

    const score = selectedAnswers.filter(
        (ans, i) => ans !== null && ans === questions[i]?.correct_index
    ).length;

    // ─── Subject Selector ────────────────────────────
    if (quizState === 'select') {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary-violet)] to-[var(--color-primary-blue)] flex items-center justify-center">
                            <Brain size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Quiz</h1>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Test your knowledge with AI-generated quizzes
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Subject Cards */}
                <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                        Choose a Subject
                    </h2>
                    {subjects.length === 0 ? (
                        <div className="glass-card rounded-2xl p-12 text-center">
                            <BookOpen size={48} className="mx-auto text-[var(--color-text-muted)] mb-4 opacity-40" />
                            <p className="text-[var(--color-text-muted)]">
                                No subjects yet. Upload study materials in the Analyze tab first.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {subjects.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => handleStartQuiz(s)}
                                    disabled={s.file_count === 0}
                                    className={`
                    group glass-card rounded-2xl p-6 text-left transition-all duration-300
                    ${s.file_count > 0
                                            ? 'hover:scale-[1.02] hover:shadow-xl hover:shadow-[var(--color-primary-violet)]/10 cursor-pointer'
                                            : 'opacity-50 cursor-not-allowed'
                                        }
                  `}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                                            style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}99)` }}
                                        >
                                            {s.name.charAt(0).toUpperCase()}
                                        </div>
                                        <ChevronRight
                                            size={20}
                                            className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary-violet)] group-hover:translate-x-1 transition-all"
                                        />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                                        {s.name}
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                                        <span className="flex items-center gap-1">
                                            <FileText size={14} /> {s.file_count} file{s.file_count !== 1 ? 's' : ''}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} /> {Math.round(s.total_study_time)}m
                                        </span>
                                    </div>
                                    {s.file_count === 0 && (
                                        <p className="text-xs text-[var(--color-text-muted)] mt-2 italic">
                                            Upload PPT files first
                                        </p>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── Loading ─────────────────────────────────────
    if (quizState === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-500">
                <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-primary-violet)] to-[var(--color-primary-blue)] flex items-center justify-center animate-pulse">
                        <Sparkles size={32} className="text-white" />
                    </div>
                    <Loader2 size={64} className="absolute -top-5 -left-5 text-[var(--color-primary-violet)]/30 animate-spin" />
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                        Generating Quiz…
                    </h2>
                    <p className="text-[var(--color-text-muted)]">
                        AI is crafting questions from <strong>{selectedSubject?.name}</strong> materials
                    </p>
                </div>
            </div>
        );
    }

    // ─── Quiz Mode ───────────────────────────────────
    if (quizState === 'quiz') {
        const q = questions[currentQ];
        const answered = selectedAnswers[currentQ] !== null;

        return (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
                {/* Top bar */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleBackToSubjects}
                        className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        ← Back
                    </button>
                    <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                        <span className="flex items-center gap-1">
                            <Clock size={14} /> {formatTime(elapsedSeconds)}
                        </span>
                        <span className="font-medium text-[var(--color-text-primary)]">
                            {currentQ + 1} / {questions.length}
                        </span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary-violet)] to-[var(--color-primary-blue)] transition-all duration-500"
                        style={{ width: `${((currentQ + (answered ? 1 : 0)) / questions.length) * 100}%` }}
                    />
                </div>

                {/* Question card */}
                <div className="glass-card rounded-2xl p-8">
                    <div className="flex items-start gap-3 mb-6">
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--color-primary-violet)]/20 flex items-center justify-center text-sm font-bold text-[var(--color-primary-violet)]">
                            {currentQ + 1}
                        </span>
                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] leading-relaxed">
                            {q.question}
                        </h2>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        {q.options.map((option, i) => {
                            const isSelected = selectedAnswers[currentQ] === i;
                            const isCorrect = answered && i === q.correct_index;
                            const isWrong = answered && isSelected && i !== q.correct_index;

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleSelectAnswer(i)}
                                    disabled={answered}
                                    className={`
                    w-full text-left p-4 rounded-xl border transition-all duration-300
                    ${!answered
                                            ? 'border-white/10 bg-white/5 hover:border-[var(--color-primary-violet)]/50 hover:bg-[var(--color-primary-violet)]/10 cursor-pointer'
                                            : isCorrect
                                                ? 'border-emerald-400/50 bg-emerald-500/15'
                                                : isWrong
                                                    ? 'border-red-400/50 bg-red-500/15'
                                                    : 'border-white/5 bg-white/3 opacity-60'
                                        }
                  `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`
                        flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold
                        ${!answered
                                                    ? 'bg-white/10 text-[var(--color-text-muted)]'
                                                    : isCorrect
                                                        ? 'bg-emerald-500 text-white'
                                                        : isWrong
                                                            ? 'bg-red-500 text-white'
                                                            : 'bg-white/10 text-[var(--color-text-muted)]'
                                                }
                      `}
                                        >
                                            {answered && isCorrect ? (
                                                <CheckCircle2 size={16} />
                                            ) : answered && isWrong ? (
                                                <XCircle size={16} />
                                            ) : (
                                                String.fromCharCode(65 + i)
                                            )}
                                        </span>
                                        <span className={`text-[var(--color-text-primary)] ${isCorrect ? 'font-semibold' : ''}`}>
                                            {option}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Explanation */}
                    {showExplanation && q.explanation && (
                        <div className="mt-6 p-4 rounded-xl bg-[var(--color-primary-violet)]/10 border border-[var(--color-primary-violet)]/20 animate-in slide-in-from-bottom-2 duration-300">
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                <strong className="text-[var(--color-primary-violet)]">Explanation:</strong>{' '}
                                {q.explanation}
                            </p>
                        </div>
                    )}
                </div>

                {/* Next button */}
                {answered && (
                    <div className="flex justify-end animate-in fade-in duration-300">
                        <button
                            onClick={handleNext}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary-violet)] to-[var(--color-primary-blue)] text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            {currentQ < questions.length - 1 ? 'Next Question' : 'See Results'}
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ─── Results ─────────────────────────────────────
    if (quizState === 'results') {
        const percentage = Math.round((score / questions.length) * 100);
        const emoji = percentage >= 80 ? '🏆' : percentage >= 60 ? '👍' : percentage >= 40 ? '📖' : '💪';
        const title = percentage >= 80 ? 'Excellent!' : percentage >= 60 ? 'Good Job!' : percentage >= 40 ? 'Keep Studying' : 'Don\'t Give Up!';

        return (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
                {/* Score Header */}
                <div className="glass-card rounded-2xl p-8 text-center">
                    <div className="text-5xl mb-3">{emoji}</div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">{title}</h1>
                    <p className="text-[var(--color-text-muted)] mb-6">
                        {selectedSubject?.name} Quiz Complete
                    </p>

                    {/* Score ring */}
                    <div className="relative w-36 h-36 mx-auto mb-6">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                            <circle
                                cx="60" cy="60" r="50" fill="none"
                                stroke="url(#grad)" strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${percentage * 3.14} 314`}
                            />
                            <defs>
                                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="var(--color-primary-violet)" />
                                    <stop offset="100%" stopColor="var(--color-primary-blue)" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-[var(--color-text-primary)]">{percentage}%</span>
                            <span className="text-xs text-[var(--color-text-muted)]">{score}/{questions.length}</span>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                        <div className="p-3 rounded-xl bg-emerald-500/10">
                            <Trophy size={18} className="mx-auto mb-1 text-emerald-400" />
                            <div className="text-lg font-bold text-emerald-400">{score}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">Correct</div>
                        </div>
                        <div className="p-3 rounded-xl bg-red-500/10">
                            <Target size={18} className="mx-auto mb-1 text-red-400" />
                            <div className="text-lg font-bold text-red-400">{questions.length - score}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">Wrong</div>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-500/10">
                            <Zap size={18} className="mx-auto mb-1 text-blue-400" />
                            <div className="text-lg font-bold text-blue-400">{formatTime(elapsedSeconds)}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">Time</div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-3">
                    <button
                        onClick={handleRetake}
                        className="px-5 py-3 rounded-xl border border-white/15 bg-white/5 text-[var(--color-text-primary)] font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <RotateCcw size={16} />
                        Retake Quiz
                    </button>
                    <button
                        onClick={handleBackToSubjects}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary-violet)] to-[var(--color-primary-blue)] text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        <BookOpen size={16} />
                        Try Another Subject
                    </button>
                </div>

                {/* Question Review */}
                <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                        Review Answers
                    </h2>
                    <div className="space-y-3">
                        {questions.map((q, i) => {
                            const userAnswer = selectedAnswers[i];
                            const isCorrect = userAnswer === q.correct_index;
                            return (
                                <div
                                    key={i}
                                    className={`
                    glass-card rounded-xl p-5 border-l-4 transition-all
                    ${isCorrect ? 'border-l-emerald-400' : 'border-l-red-400'}
                  `}
                                >
                                    <div className="flex items-start gap-3 mb-2">
                                        {isCorrect ? (
                                            <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <XCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium text-[var(--color-text-primary)] text-sm">
                                                {i + 1}. {q.question}
                                            </p>
                                            {!isCorrect && (
                                                <p className="text-xs text-red-300 mt-1">
                                                    Your answer: {q.options[userAnswer!]} →{' '}
                                                    <span className="text-emerald-300">
                                                        Correct: {q.options[q.correct_index]}
                                                    </span>
                                                </p>
                                            )}
                                            {q.explanation && (
                                                <p className="text-xs text-[var(--color-text-muted)] mt-1">{q.explanation}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
