import React, { useState, useEffect } from 'react';
import { Card } from '../../components/data-display/Card';
import { Button } from '../../components/form-controls/Button';
import { useToast } from '../../components/feedback/Toast';
import { Badge } from '../../components/data-display/Badge';
import { Check, X, FileText, User, Download, Eye, HardDrive } from 'lucide-react';
import {
  fetchPendingPRs,
  approvePR,
  rejectPR,
  downloadPRFile,
  getPRPreviewUrl,
  type MaterialRequestResponse,
} from '../../services/api';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function TeacherInbox() {
  const [prs, setPrs] = useState<MaterialRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadPRs();
  }, []);

  const loadPRs = async () => {
    try {
      setLoading(true);
      const data = await fetchPendingPRs();
      setPrs(data);
    } catch (error: any) {
      showToast('Failed to load pending requests.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approvePR(id);
      showToast('Material approved and added to library', 'success');
      setPrs(prs.filter(pr => pr.id !== id));
    } catch (error: any) {
      showToast(error.message || 'Failed to approve completely', 'error');
      loadPRs();
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Are you sure you want to reject this request? It cannot be undone.')) return;
    try {
      await rejectPR(id);
      showToast('Material request rejected', 'success');
      setPrs(prs.filter(pr => pr.id !== id));
    } catch (error: any) {
      showToast('Failed to reject request', 'error');
    }
  };

  const handlePreview = (pr: MaterialRequestResponse) => {
    // For PDFs, open in a new tab for direct preview
    // For other file types, download them
    const ext = pr.file_name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      window.open(getPRPreviewUrl(pr.id), '_blank', 'noopener,noreferrer');
    } else {
      downloadPRFile(pr.id, pr.file_name);
    }
  };

  const handleDownload = (pr: MaterialRequestResponse) => {
    downloadPRFile(pr.id, pr.file_name);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-2">
          Material Requests
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Review and approve study materials submitted by students. Preview files before making a decision.
        </p>
      </div>

      {loading ? (
        <p className="text-[var(--color-text-muted)]">Loading...</p>
      ) : prs.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="text-[var(--color-text-muted)]">Inbox is empty. No pending materials to review.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {prs.map((pr) => (
            <Card key={pr.id} variant="compact" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col gap-4">
                {/* Top row: file info */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText size={20} className="text-[var(--color-primary-violet)] flex-shrink-0" />
                      <span className="font-semibold text-lg text-[var(--color-text-primary)] truncate">{pr.title || pr.file_name}</span>
                      <Badge variant="default" className="bg-yellow-500/20 text-yellow-600 border border-yellow-500/30">
                        Pending
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)] flex-wrap">
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {pr.student_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive size={14} />
                        {pr.file_name}
                      </span>
                      <Badge variant="default" size="sm">
                        {(pr.file_type || 'file').toUpperCase()}
                      </Badge>
                      {pr.file_size > 0 && (
                        <span className="text-xs">{formatFileSize(pr.file_size)}</span>
                      )}
                    </div>

                    {pr.description && (
                      <p className="text-sm text-[var(--color-text-muted)] italic">"{pr.description}"</p>
                    )}
                  </div>
                </div>

                {/* Action buttons row */}
                <div className="flex items-center gap-2 flex-wrap border-t border-white/10 pt-3">
                  {/* Preview / View File */}
                  <Button
                    variant="outline"
                    className="flex-1 md:flex-none border-[var(--color-primary-violet)]/30 text-[var(--color-primary-violet)] hover:bg-[var(--color-primary-violet)]/10"
                    onClick={() => handlePreview(pr)}
                  >
                    <Eye size={16} className="mr-1.5" />
                    View File
                  </Button>

                  {/* Download */}
                  <Button
                    variant="outline"
                    className="flex-1 md:flex-none border-white/20 text-[var(--color-text-secondary)] hover:bg-white/10"
                    onClick={() => handleDownload(pr)}
                  >
                    <Download size={16} className="mr-1.5" />
                    Download
                  </Button>

                  {/* Spacer */}
                  <div className="flex-1 hidden md:block" />

                  {/* Reject */}
                  <Button
                    variant="outline"
                    className="flex-1 md:flex-none border-red-500/30 text-red-500 hover:bg-red-500/10"
                    onClick={() => handleReject(pr.id)}
                  >
                    <X size={16} className="mr-1" />
                    Reject
                  </Button>

                  {/* Approve */}
                  <Button
                    className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 shadow-[0_4px_14px_rgba(34,197,94,0.3)]"
                    onClick={() => handleApprove(pr.id)}
                  >
                    <Check size={16} className="mr-1" />
                    Approve & Analyze
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
