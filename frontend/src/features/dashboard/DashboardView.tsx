import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, TrendingUp, Bell, FileText, Sparkles, Brain, CheckSquare } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { StatsCard, Card } from '../../components/data-display/Card';
import { Badge } from '../../components/data-display/Badge';
import { Button } from '../../components/form-controls/Button';
import { useAuth } from '../../context/AuthContext';
import {
  fetchDashboardStats,
  type DashboardStats,
  type DashboardRecentFile,
  type DashboardSubjectStat,
} from '../../services/api';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { isStudent, user } = useAuth();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // If student, load their study list from localStorage
      let fileIds: string[] | undefined;
      if (isStudent && user) {
        const storageKey = `studify_studylist_${user.id}`;
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              fileIds = parsed;
            }
          }
        } catch { /* ignore parse errors */ }
      }

      const data = await fetchDashboardStats(fileIds);
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMinutes = (minutes: number): string => {
    if (minutes === 0) return '0m';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const getTimeAgo = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'Yesterday' : `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Here's your study overview
        </p>
      </div>

      {/* Study List Info Banner (students only) */}
      {isStudent && stats && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          {stats.has_filter ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30">
              <CheckSquare size={18} className="text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-300">
                Showing stats for <strong>{stats.selected_count} selected file{stats.selected_count !== 1 ? 's' : ''}</strong> from your study list.
                <button
                  onClick={() => onNavigate('library')}
                  className="ml-2 underline text-green-400 hover:text-green-300"
                >
                  Edit study list
                </button>
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-primary-violet)]/10 border border-[var(--color-primary-violet)]/30">
              <CheckSquare size={18} className="text-[var(--color-primary-violet)] flex-shrink-0" />
              <p className="text-sm text-[var(--color-text-muted)]">
                Tip: Go to the <button onClick={() => onNavigate('library')} className="underline text-[var(--color-primary-violet)] hover:text-white">Library</button> and tick the PPTs you want to study. Your dashboard will then show the time needed for <em>only</em> those files.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
        <StatsCard
          title={stats?.has_filter ? 'Study Time (Selected)' : 'Total Study Time'}
          value={stats ? `${stats.total_study_hours}h` : '—'}
          subtitle={
            stats?.has_filter
              ? `${stats.selected_count} of ${stats.total_analyzed} files selected`
              : stats ? `${stats.total_analyzed} files analyzed` : 'Loading...'
          }
          icon={<Clock size={20} />}
        />
        <StatsCard
          title="Subjects"
          value={stats ? `${stats.total_subjects}` : '—'}
          subtitle={stats?.subjects?.length ? stats.subjects.map(s => s.name).join(', ') : 'No subjects yet'}
          icon={<TrendingUp size={20} />}
        />
        <StatsCard
          title="Materials Uploaded"
          value={stats ? `${stats.total_files}` : '—'}
          subtitle={stats && stats.total_files > stats.total_analyzed
            ? `${stats.total_files - stats.total_analyzed} pending analysis`
            : 'All analyzed ✓'}
          icon={<BookOpen size={20} />}
        />
      </div>

      {/* Visual Charts */}
      {stats && stats.subjects.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '150ms' }}>
          <Card>
            <div style={{ padding: '20px 20px 4px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {stats.has_filter ? 'Study Distribution (Selected)' : 'Study Distribution'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Minutes per subject</p>
            </div>
            {(() => {
              const pieData = stats.subjects.filter(s => s.total_study_minutes > 0);
              if (pieData.length === 0) {
                return (
                  <div style={{ height: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: 0.45 }}>
                    <span style={{ fontSize: '40px' }}>📊</span>
                    <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                      {stats.has_filter
                        ? <>No study time for selected files.<br/>Tick files in the Library to see stats.</>
                        : <>No study time yet.<br/>Analyse files to populate this.</>}
                    </p>
                  </div>
                );
              }
              return (
                <div style={{ height: '280px', padding: '8px' }}>
                  <ResponsiveContainer width="99%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="total_study_minutes"
                        nameKey="name"
                        animationBegin={0}
                        animationDuration={1200}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={`pie-${i}`} fill={entry.color || '#8B5CF6'} stroke="rgba(255,255,255,0.08)" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(20,20,35,0.97)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '13px' }}
                        formatter={(v: any) => [`${v} min`, 'Study Time']}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </Card>

          <Card>
            <div style={{ padding: '20px 20px 4px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Material Density</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Files uploaded per subject</p>
            </div>
            {stats.subjects.every(s => s.file_count === 0) ? (
              <div style={{ height: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: 0.45 }}>
                <span style={{ fontSize: '40px' }}>📁</span>
                <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  No files uploaded yet.<br/>Upload materials to see this chart.
                </p>
              </div>
            ) : (
              <div style={{ height: '280px', padding: '8px' }}>
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={stats.subjects} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.06} vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 'auto']} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      contentStyle={{ backgroundColor: 'rgba(20,20,35,0.97)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '13px' }}
                      formatter={(v: any) => [v, 'Files']}
                    />
                    <Bar dataKey="file_count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {stats.subjects.map((entry, i) => (
                        <Cell key={`bar-${i}`} fill={entry.color || '#8B5CF6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject Overview */}
          {stats && stats.subjects.length > 0 && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  Your Subjects
                </h2>
                <button
                  onClick={() => onNavigate('library')}
                  className="text-sm font-medium text-[var(--color-primary-violet)] hover:underline"
                >
                  Manage
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stats.subjects.map(subject => (
                  <Card key={subject.id} variant="compact" hoverable onClick={() => onNavigate('library')}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${subject.color}20` }}
                      >
                        <BookOpen size={18} style={{ color: subject.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[var(--color-text-primary)] truncate">
                          {subject.name}
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {subject.file_count} file{subject.file_count !== 1 ? 's' : ''}
                          {subject.total_study_minutes > 0 && (
                            <span> • {formatMinutes(subject.total_study_minutes)} study</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent Analyses */}
          <div className="animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Recent Analyses
              </h2>
              <button
                onClick={() => onNavigate('analyze')}
                className="text-sm font-medium text-[var(--color-primary-violet)] hover:underline"
              >
                Upload More
              </button>
            </div>
            <div className="space-y-3">
              {stats && stats.recent_analyses.length > 0 ? (
                stats.recent_analyses.map(analysis => (
                  <Card key={analysis.id} variant="compact" hoverable onClick={() => onNavigate('library')}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span 
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            style={{ backgroundColor: `${analysis.subject_color}20`, color: analysis.subject_color, border: `1px solid ${analysis.subject_color}40` }}
                          >
                            {analysis.subject}
                          </span>
                          {analysis.difficulty && (
                            <Badge variant={
                              analysis.difficulty === 'easy' ? 'success' :
                                analysis.difficulty === 'medium' ? 'warning' : 'error'
                            } size="sm">
                              {analysis.difficulty}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-[var(--color-text-primary)] mb-1">
                          {analysis.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                          {analysis.estimated_hours !== undefined && (
                            <span>~{analysis.estimated_hours}h study</span>
                          )}
                          {analysis.slide_count && (
                            <span>{analysis.slide_count} slides</span>
                          )}
                          <span>{getTimeAgo(analysis.uploaded_at)}</span>
                        </div>
                        {/* AI reasoning */}
                        {analysis.ai_reasoning && (
                          <div className="mt-2 flex items-start gap-2 text-xs text-[var(--color-primary-violet)]">
                            <Brain size={12} className="mt-0.5 flex-shrink-0" />
                            <span className="italic">{analysis.ai_reasoning}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card variant="default">
                  <div className="text-center py-8">
                    <FileText size={32} className="mx-auto mb-3 text-[var(--color-text-muted)] opacity-40" />
                    <p className="text-[var(--color-text-muted)] mb-4">
                      No files uploaded yet. Upload PPTs to see AI-powered analysis here.
                    </p>
                    <Button onClick={() => onNavigate('analyze')}>
                      Upload & Analyze
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Info */}
          <div className="animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: '200ms' }}>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <Sparkles size={20} />
              AI-Powered
            </h2>
            <Card variant="default">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[var(--color-primary-violet)]/10 border border-[var(--color-primary-violet)]/30">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    🧠 Gemini AI Analysis
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Upload PPT files to get AI-powered study time estimates, difficulty ratings, and topic extraction
                  </p>
                </div>
                {stats && stats.total_analyzed > 0 && (
                  <div className="p-3 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/30">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      ✅ {stats.total_analyzed} file{stats.total_analyzed !== 1 ? 's' : ''} analyzed
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      {stats.total_study_hours}h {stats.has_filter ? 'selected' : 'total'} estimated study time
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: '300ms' }}>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
              Quick Actions
            </h2>
            <Card variant="default">
              <div className="space-y-3">
                <button
                  onClick={() => onNavigate('analyze')}
                  className="w-full p-3 text-left rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <p className="font-medium text-[var(--color-text-primary)]">Upload & Analyze</p>
                  <p className="text-sm text-[var(--color-text-muted)]">Add new materials</p>
                </button>
                <button
                  onClick={() => onNavigate('planner')}
                  className="w-full p-3 text-left rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <p className="font-medium text-[var(--color-text-primary)]">Generate Plan</p>
                  <p className="text-sm text-[var(--color-text-muted)]">Create study schedule</p>
                </button>
                <button
                  onClick={() => onNavigate('library')}
                  className="w-full p-3 text-left rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {isStudent ? 'My Study List' : 'Manage Subjects'}
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {isStudent ? 'Select files to study' : 'Add or edit subjects'}
                  </p>
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
