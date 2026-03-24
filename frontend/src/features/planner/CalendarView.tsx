import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, Calendar as CalIcon } from 'lucide-react';
import { Button } from '../../components/form-controls/Button';
import { Card } from '../../components/data-display/Card';
import { Badge } from '../../components/data-display/Badge';

interface CalendarSession {
  id: string;
  subject: string;
  color: string;
  title: string;
  duration: number;
  startTime: string;
  day: string;
  date?: string; // e.g. "2024-03-24"
  type: string;
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [sessions, setSessions] = useState<CalendarSession[]>([]);

  // Load sessions from localStorage (shared from PlannerView)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('studify_sessions');
      if (stored) setSessions(JSON.parse(stored));
    } catch { /* ignore */ }

    const handler = () => {
      try {
        const stored = localStorage.getItem('studify_sessions');
        if (stored) setSessions(JSON.parse(stored));
      } catch { /* ignore */ }
    };
    window.addEventListener('storage', handler);
    window.addEventListener('studify_sessions_updated', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('studify_sessions_updated', handler);
    };
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigation
  const navigate = (dir: number) => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + dir));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + dir * 7);
      setCurrentDate(d);
    }
  };

  // Helper to get YYYY-MM-DD
  const formatDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get sessions for a specific date
  const getSessionsForDate = (dateObj: Date) => {
    const dateStr = formatDateString(dateObj);
    return sessions.filter(s => s.date === dateStr);
  };

  // Today info
  const today = new Date();
  const todaySessions = getSessionsForDate(today);

  // Month view helpers
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const calDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Week view helpers
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay()); // Sunday
    return d;
  };
  const weekStart = getWeekStart(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const weekHours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

  // Export as ICS
  const handleExport = () => {
    if (sessions.length === 0) return;
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Studify//EN\n';
    sessions.forEach(s => {
      const hourMin = s.startTime.split(':');
      let datePrefix = "20260101";
      if (s.date) {
        datePrefix = s.date.replace(/-/g, '');
      }
      ics += `BEGIN:VEVENT\nSUMMARY:${s.title}\nDESCRIPTION:${s.subject} - ${s.type} (${s.duration}min)\nDTSTART:${datePrefix}T${hourMin[0]}${hourMin[1]}00\nDURATION:PT${s.duration}M\nEND:VEVENT\n`;
    });
    ics += 'END:VCALENDAR';
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'studify_schedule.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-2">
            Calendar
          </h1>
          <p className="text-[var(--color-text-muted)]">
            View and manage your study schedule
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex rounded-xl overflow-hidden border border-white/20">
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                view === 'week'
                  ? 'bg-[var(--color-primary-violet)] text-white'
                  : 'bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                view === 'month'
                  ? 'bg-[var(--color-primary-violet)] text-white'
                  : 'bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10'
              }`}
            >
              Month
            </button>
          </div>
          <Button variant="secondary" onClick={handleExport}>
            <Download size={18} />
            Export
          </Button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <Card variant="default" className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {view === 'month'
              ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            }
          </h2>
          <div className="flex gap-2">
            <Button variant="icon" size="sm" onClick={() => navigate(-1)} aria-label="Previous">
              <ChevronLeft size={20} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="icon" size="sm" onClick={() => navigate(1)} aria-label="Next">
              <ChevronRight size={20} />
            </Button>
          </div>
        </div>

        {/* ─── Month View ─── */}
        {view === 'month' && (
          <div className="grid grid-cols-7 gap-2">
            {shortDays.map(day => (
              <div key={day} className="text-center font-medium text-[var(--color-text-muted)] py-2">
                {day}
              </div>
            ))}

            {emptyDays.map(i => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {calDays.map(day => {
              const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const daySessions = getSessionsForDate(cellDate);

              const isToday = day === today.getDate() &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getFullYear() === today.getFullYear();

              return (
                <div
                  key={day}
                  className={`
                    aspect-square p-2 rounded-lg border transition-all duration-200
                    ${isToday
                      ? 'border-[var(--color-primary-violet)] bg-[var(--color-primary-violet)]/10'
                      : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                    }
                  `}
                >
                  <div className="h-full flex flex-col">
                    <span className={`
                      text-sm font-medium
                      ${isToday ? 'text-[var(--color-primary-violet)]' : 'text-[var(--color-text-primary)]'}
                    `}>
                      {day}
                    </span>
                    {daySessions.length > 0 && (
                      <div className="mt-1 space-y-0.5 overflow-hidden flex-1">
                        {daySessions.slice(0, 3).map((s, i) => (
                          <div
                            key={i}
                            className="w-full h-1.5 rounded-full"
                            style={{ backgroundColor: s.color }}
                            title={`${s.subject} (${s.duration}m)`}
                          />
                        ))}
                        {daySessions.length > 3 && (
                          <span className="text-[10px] text-[var(--color-text-muted)]">
                            +{daySessions.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Week View ─── */}
        {view === 'week' && (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header row */}
              <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: '60px repeat(7, minmax(0, 1fr))' }}>
                <div className="text-sm font-medium text-[var(--color-text-muted)]">Time</div>
                {weekDays.map((wd, i) => {
                  const isWdToday = wd.toDateString() === today.toDateString();
                  return (
                    <div
                      key={i}
                      className={`text-center text-sm font-medium ${
                        isWdToday ? 'text-[var(--color-primary-violet)]' : 'text-[var(--color-text-primary)]'
                      }`}
                    >
                      {shortDays[wd.getDay()]} {wd.getDate()}
                    </div>
                  );
                })}
              </div>

              {/* Time grid */}
              <div className="space-y-1 relative">
                {weekHours.map(hour => (
                  <div key={hour} className="grid gap-2" style={{ gridTemplateColumns: '60px repeat(7, minmax(0, 1fr))' }}>
                    <div className="text-xs text-[var(--color-text-muted)] py-2">
                      {hour}:00
                    </div>
                    {weekDays.map((wd, di) => {
                      const wdDateStr = formatDateString(wd);
                      const hourStr = hour.toString().padStart(2, '0');
                      const cellSession = sessions.find(
                        s => s.date === wdDateStr && s.startTime.startsWith(`${hourStr}:`)
                      );

                      return (
                        <div
                          key={`${di}-${hour}`}
                          className="h-[48px] rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors relative"
                        >
                          {cellSession && (
                            <div
                              className="absolute top-0 left-0 w-full p-2 rounded-lg z-10 shadow-md backdrop-blur-sm"
                              style={{
                                height: `${Math.max(30, (cellSession.duration / 60) * 48)}px`, // Proportional to 48px/hour
                                backgroundColor: `${cellSession.color}30`,
                                borderLeft: `3px solid ${cellSession.color}`,
                              }}
                            >
                              <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                                {cellSession.subject}
                              </p>
                              <p className="text-[10px] text-[var(--color-text-muted)]">
                                {cellSession.duration}m · {cellSession.type}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Today's Schedule */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms' }}>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
          Today's Schedule
        </h2>
        {todaySessions.length > 0 ? (
          <div className="space-y-3">
            {todaySessions.map(session => (
              <Card key={session.id} variant="compact">
                <div className="flex items-start gap-4">
                  <div
                    className="w-1 self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: session.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-[var(--color-text-primary)]">
                          {session.title}
                        </h3>
                        <p className="text-sm text-[var(--color-text-muted)]">{session.subject}</p>
                      </div>
                      <Badge size="sm">{session.type}</Badge>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {session.startTime} • {session.duration} minutes
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="compact">
            <div className="text-center py-6">
              <CalIcon size={32} className="mx-auto mb-2 text-[var(--color-text-muted)] opacity-40" />
              <p className="text-[var(--color-text-muted)]">
                {sessions.length === 0
                  ? 'No timetable generated yet. Go to Planner → Generate Plan.'
                  : 'No sessions scheduled for today.'}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Legend */}
      <Card variant="compact" className="animate-in fade-in duration-500" style={{ animationDelay: '300ms' }}>
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[var(--color-primary-violet)]" />
            <span className="text-sm text-[var(--color-text-muted)]">Deep Focus (60–90m)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[var(--color-accent-blue)]" />
            <span className="text-sm text-[var(--color-text-muted)]">Review (30–60m)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[var(--color-warning)]" />
            <span className="text-sm text-[var(--color-text-muted)]">Quick Recap (&lt;30m)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
