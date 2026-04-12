/**
 * API client for communicating with the Studify backend.
 * All requests go through the Vite proxy (/api → backend).
 */

const _rawBase = (import.meta as any).env.VITE_API_URL as string | undefined;
let API_BASE = _rawBase ? _rawBase.replace(/\/$/, '') : '/api';
if (API_BASE !== '/api' && !API_BASE.endsWith('/api')) {
    API_BASE += '/api';
}

// ─── Generic helpers ─────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...(options?.headers || {}),
        },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(error.detail || `Request failed: ${res.status}`);
    }

    // 204 No Content
    if (res.status === 204) return undefined as T;

    return res.json();
}

// ─── Subject API ─────────────────────────────────────────

export interface SubjectResponse {
    id: string;
    name: string;
    description: string | null;
    color: string;
    file_count: number;
    total_study_time: number;
    created_at: string;
    updated_at: string;
}

export async function fetchSubjects(): Promise<SubjectResponse[]> {
    return request<SubjectResponse[]>('/subjects/');
}

export async function createSubject(data: {
    name: string;
    description?: string;
    color: string;
}): Promise<SubjectResponse> {
    return request<SubjectResponse>('/subjects/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function updateSubject(
    id: string,
    data: { name?: string; description?: string; color?: string }
): Promise<SubjectResponse> {
    return request<SubjectResponse>(`/subjects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function deleteSubject(id: string): Promise<void> {
    return request<void>(`/subjects/${id}`, { method: 'DELETE' });
}

// ─── File Upload API ─────────────────────────────────────

export interface SlideDetail {
    slide_number: number;
    word_count: number;
    image_count: number;
    has_text: boolean;
    has_images: boolean;
    estimated_minutes: number;
}

export interface FileAnalysisResponse {
    slide_count: number;
    total_word_count: number;
    total_image_count: number;
    total_char_count: number;
    estimated_reading_time: number;
    estimated_study_time: number;
    difficulty: string;
    slides: SlideDetail[];
    // AI-powered fields (Gemini)
    ai_estimated_study_time: number | null;
    ai_difficulty: string | null;
    ai_key_topics: string[] | null;
    ai_study_tips: string[] | null;
    ai_reasoning: string | null;
}

export interface UploadedFileResponse {
    id: string;
    file_name: string;
    original_name: string;
    file_type: string;
    file_size: number;
    subject_id: string;
    subject_name: string | null;
    subject_color: string | null;
    uploaded_at: string;
    analysis: FileAnalysisResponse | null;
}

export async function uploadFile(
    file: File,
    subjectId: string,
    onProgress?: (progress: number) => void
): Promise<UploadedFileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject_id', subjectId);

    // Note: fetch doesn't support upload progress natively.
    // For progress tracking we use XMLHttpRequest.
    if (onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API_BASE}/files/upload`);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    try {
                        const err = JSON.parse(xhr.responseText);
                        reject(new Error(err.detail || 'Upload failed'));
                    } catch {
                        reject(new Error('Upload failed'));
                    }
                }
            };

            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
        });
    }

    return request<UploadedFileResponse>('/files/upload', {
        method: 'POST',
        body: formData,
    });
}

export async function fetchFiles(subjectId?: string): Promise<UploadedFileResponse[]> {
    const query = subjectId ? `?subject_id=${subjectId}` : '';
    return request<UploadedFileResponse[]>(`/files/${query}`);
}

export async function fetchFile(fileId: string): Promise<UploadedFileResponse> {
    return request<UploadedFileResponse>(`/files/${fileId}`);
}

export async function deleteFile(fileId: string): Promise<void> {
    return request<void>(`/files/${fileId}`, { method: 'DELETE' });
}

export function getDownloadUrl(fileId: string): string {
    // Legacy — kept for backward compat. Prefer downloadFile() instead.
    return `${API_BASE}/files/${fileId}/download`;
}

export async function downloadFile(fileId: string, fallbackName: string = 'file'): Promise<void> {
    const fullUrl = `${API_BASE}/files/${fileId}/download`;
    const resp = await fetch(fullUrl);
    if (!resp.ok) throw new Error('Download failed');

    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        // Cloud URL path — open directly in new tab
        const data = await resp.json() as { url: string; filename: string };
        window.open(data.url, '_blank', 'noopener,noreferrer');
    } else {
        // Local binary file path — trigger browser download
        const blob = await resp.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fallbackName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }
}

// ─── Timetable API ───────────────────────────────────────

export interface StudySessionResponse {
    id: string;
    subject: string;
    subject_color: string;
    title: string;
    duration: number;
    start_time: string;
    day: string;
    date: string;
    session_type: string;
}

export interface TimetableResponse {
    sessions: StudySessionResponse[];
    total_hours: number;
    days: number;
    subjects_covered: number;
}

export async function generateTimetable(data: {
    subject_ids: string[];
    hours_per_day?: number;
    preferred_blocks?: string[];
    exam_date?: string;
    days_count?: number;
    learner_speed?: 'slow' | 'medium' | 'fast';
    will_take_notes?: boolean;
    user_id?: string;
}): Promise<TimetableResponse> {
    return request<TimetableResponse>('/timetable/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

// ─── Quiz API ────────────────────────────────────────────

export interface QuizQuestionResponse {
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
}

export async function generateQuiz(
    subjectId: string,
    numQuestions: number = 10
): Promise<QuizQuestionResponse[]> {
    const response = await request<{ mongo_id: string | null; questions: QuizQuestionResponse[] }>(
        '/quiz/generate',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject_id: subjectId,
                num_questions: numQuestions,
            }),
        }
    );
    // Backend now returns { mongo_id, questions } — extract the array
    return response.questions ?? (response as any);
}

// ─── Dashboard API ───────────────────────────────────────

export interface DashboardRecentFile {
    id: string;
    title: string;
    subject: string;
    subject_color: string;
    uploaded_at: string | null;
    estimated_hours?: number;
    difficulty?: string;
    slide_count?: number;
    word_count?: number;
    ai_reasoning?: string;
}

export interface DashboardSubjectStat {
    id: string;
    name: string;
    color: string;
    file_count: number;
    total_study_minutes: number;
}

export interface DashboardStats {
    total_subjects: number;
    total_files: number;
    total_analyzed: number;
    selected_count: number;
    total_study_hours: number;
    recent_analyses: DashboardRecentFile[];
    subjects: DashboardSubjectStat[];
    has_filter: boolean;
}

export async function fetchDashboardStats(fileIds?: string[]): Promise<DashboardStats> {
    const query = fileIds && fileIds.length > 0 ? `?file_ids=${fileIds.join(',')}` : '';
    return request<DashboardStats>(`/dashboard/stats${query}`);
}

// ─── Material PR API ─────────────────────────────────────

export interface MaterialRequestResponse {
    id: string;
    title: string;
    description: string;
    student_name: string;
    file_name: string;
    file_type: string;
    file_size: number;
    subject_id: string;
    created_at: string;
}

export async function submitPR(
    file: File,
    subjectId: string,
    studentId: string,
    title: string,
    description: string,
    onProgress?: (progress: number) => void
): Promise<{ message: string; id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject_id', subjectId);
    formData.append('student_id', studentId);
    formData.append('title', title);
    formData.append('description', description);

    if (onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API_BASE}/prs/submit`);
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            };
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error('Upload failed'));
                }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
        });
    }

    return request<{ message: string; id: string }>('/prs/submit', {
        method: 'POST',
        body: formData,
    });
}

export async function fetchPendingPRs(subjectId?: string): Promise<MaterialRequestResponse[]> {
    const query = subjectId ? `?subject_id=${subjectId}` : '';
    return request<MaterialRequestResponse[]>(`/prs/pending${query}`);
}

export async function approvePR(prId: string): Promise<any> {
    return request<any>(`/prs/${prId}/approve`, { method: 'POST' });
}

export async function rejectPR(prId: string): Promise<void> {
    return request<void>(`/prs/${prId}/reject`, { method: 'POST' });
}

export async function downloadPRFile(prId: string, fileName: string): Promise<void> {
    const fullUrl = `${API_BASE}/prs/${prId}/download`;
    const resp = await fetch(fullUrl);
    if (!resp.ok) throw new Error('Download failed');

    const blob = await resp.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}

export function getPRPreviewUrl(prId: string): string {
    return `${API_BASE}/prs/${prId}/download`;
}
// ─── Auth API ────────────────────────────────────────────

export interface LoginResponse {
    id: string;
    email: string;
    role: string;
    full_name: string;
}

export async function loginUser(email: string, password: string, role?: string): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: role || '' }),
    });
}

export async function fetchUsers(): Promise<LoginResponse[]> {
    return request<LoginResponse[]>('/auth/users');
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
    return request<void>(`/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
    });
}

export interface RegisterResponse {
    message: string;
    id: string;
    role: string;
}

export async function registerUser(
    email: string,
    password: string,
    role: string,
    full_name: string = ""
): Promise<RegisterResponse> {
    return request<RegisterResponse>('/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role, full_name }),
    });
}

export async function updateProfile(userId: string, data: { full_name: string, email: string }): Promise<LoginResponse> {
    return request<LoginResponse>(`/auth/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}
