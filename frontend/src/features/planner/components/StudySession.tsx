import React from 'react';
import { Clock, GripVertical } from 'lucide-react';
import { Badge } from '../../../components/data-display/Badge';

export interface StudySession {
  id: string;
  subject: string;
  title: string;
  duration: number;
  startTime: string;
  color: string;
  type: string;
  day: string;
  date: string;
}

interface StudySessionCardProps {
  session: StudySession;
  onClick?: () => void;
  draggable?: boolean;
}

export function StudySessionCard({ session, onClick, draggable = false }: StudySessionCardProps) {
  return (
    <div
      className={`
        glass-card p-4 rounded-lg border-l-4 transition-all duration-300
        ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(88,76,120,0.15)]' : ''}
        ${draggable ? 'cursor-move' : ''}
      `}
      style={{ borderLeftColor: session.color }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start gap-3">
        {draggable && (
          <div className="text-[var(--color-text-muted)] pt-1">
            <GripVertical size={16} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h4 className="font-semibold text-[var(--color-text-primary)] truncate">
                {session.title}
              </h4>
              <p className="text-sm text-[var(--color-text-muted)]">{session.subject}</p>
            </div>
            <Badge size="sm">{session.type}</Badge>
          </div>

          <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {session.duration} min
            </span>
            <span>{session.startTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TimelineView({ sessions, onSessionClick }: { 
  sessions: StudySession[];
  onSessionClick?: (session: StudySession) => void;
}) {
  const groupedByDay = sessions.reduce((acc, session) => {
    const day = session.date || session.day;
    if (!acc[day]) acc[day] = [];
    acc[day].push(session);
    return acc;
  }, {} as Record<string, StudySession[]>);

  // Sort dates if they are in YYYY-MM-DD format
  const sortedDays = Object.keys(groupedByDay).sort();

  return (
    <div className="space-y-6">
      {sortedDays.map(day => (
        <div key={day}>
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-3">{day}</h3>
          <div className="space-y-3">
            {groupedByDay[day].map((session: StudySession) => (
              <StudySessionCard
                key={session.id}
                session={session}
                onClick={onSessionClick ? () => onSessionClick(session) : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function WeeklyGrid({ sessions, onSessionClick }: {
  sessions: StudySession[];
  onSessionClick?: (session: StudySession) => void;
}) {
  const uniqueDates = Array.from(new Set(sessions.map(s => s.date || s.day))).sort();
  const displayDates = uniqueDates.length > 0 ? uniqueDates : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

  const getHeaderLabel = (dateStr: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const d = new Date(dateStr);
      const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return `${shortDays[d.getDay()]} ${d.getDate()}`;
    }
    return dateStr.slice(0, 3);
  };

  return (
    <div className="overflow-x-auto pb-12">
      <div className="min-w-[800px]" style={{ width: Math.max(800, 100 + displayDates.length * 100) + 'px' }}>
        <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: `80px repeat(${displayDates.length}, minmax(0, 1fr))` }}>
          <div className="text-sm font-medium text-[var(--color-text-muted)]">Time</div>
          {displayDates.map(dateStr => (
            <div key={dateStr} className="text-sm font-medium text-[var(--color-text-primary)] text-center">
              {getHeaderLabel(dateStr)}
            </div>
          ))}
        </div>

        <div className="space-y-1 relative">
          {hours.map(hour => (
            <div key={hour} className="grid gap-2" style={{ gridTemplateColumns: `80px repeat(${displayDates.length}, minmax(0, 1fr))` }}>
              <div className="text-xs text-[var(--color-text-muted)] py-2">
                {hour}:00
              </div>
              {displayDates.map(dateStr => {
                const hourStr = hour.toString().padStart(2, '0');
                const daySession = sessions.find(s => 
                  (s.date === dateStr || (!s.date && s.day === dateStr)) && 
                  s.startTime.startsWith(`${hourStr}:`)
                );
                
                return (
                  <div 
                    key={`${dateStr}-${hour}`}
                    className="h-[60px] rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors relative"
                  >
                    {daySession && (
                      <div
                        className="absolute top-0 left-0 w-full p-2 rounded-lg cursor-pointer transition-all hover:scale-[1.02] z-10 shadow-md backdrop-blur-sm"
                        style={{ 
                          height: `${Math.max(30, (daySession.duration / 60) * 64)}px`, 
                          backgroundColor: `${daySession.color}cc`, 
                          borderLeft: `4px solid ${daySession.color}` 
                        }}
                        onClick={() => onSessionClick?.(daySession)}
                      >
                        <p className="text-xs font-semibold text-white truncate drop-shadow-md">
                          {daySession.subject}
                        </p>
                        <p className="text-[10px] text-white/90 truncate drop-shadow-md">
                          {daySession.duration}m
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
  );
}
