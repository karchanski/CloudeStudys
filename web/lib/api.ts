import type {
  AttendanceRecord,
  AuthSessionInfo,
  Course,
  CourseAssistant,
  CourseWorkspace,
  CourseAttendanceStat,
  CourseStudentAttendance,
  DashboardSummary,
  Group,
  Homework,
  HomeworkSubmissionReview,
  Notification,
  MoodleStatus,
  StudentProfile,
  AssistantInvite,
  TeacherCourse,
  TokenPair,
  User,
} from './types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | object | null;
  token?: string | null;
};

type AuthHooks = {
  refreshSession?: () => Promise<string | null>;
  onAuthFailure?: () => void;
};

const authHooks: AuthHooks = {};

export function configureApiAuth(hooks: AuthHooks) {
  authHooks.refreshSession = hooks.refreshSession;
  authHooks.onAuthFailure = hooks.onAuthFailure;
}

async function request<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const canAttemptRefresh = !retried && path !== '/auth/refresh' && path !== '/auth/login' && path !== '/auth/moodle/login' && path !== '/auth/logout';

  if (!isFormData && options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
    body: isFormData || !options.body ? (options.body as BodyInit | null | undefined) : JSON.stringify(options.body),
  });

  if (response.status === 401 && canAttemptRefresh && authHooks.refreshSession) {
    const nextToken = await authHooks.refreshSession();
    if (nextToken) {
      return request<T>(path, { ...options, token: nextToken }, true);
    }
    authHooks.onAuthFailure?.();
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = (await response.json()) as { detail?: string };
      if (data.detail) {
        message = data.detail;
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  baseUrl: API_BASE_URL,
  login(email: string, password: string) {
    return request<TokenPair>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },
  moodleLogin(username: string, password: string, role: 'teacher' | 'student' = 'teacher') {
    return request<TokenPair>('/auth/moodle/login', {
      method: 'POST',
      body: { username, password, role },
    });
  },
  me(token?: string | null) {
    return request<User>('/auth/me', { token });
  },
  refreshToken(refreshToken?: string | null) {
    return request<TokenPair>('/auth/refresh', {
      method: 'POST',
      body: refreshToken ? { refresh_token: refreshToken } : {},
    });
  },
  logout() {
    return request<{ status: string }>('/auth/logout', {
      method: 'POST',
    });
  },
  logoutAllSessions() {
    return request<{ status: string; revoked_sessions: number }>('/auth/logout-all', {
      method: 'POST',
    });
  },
  getAuthSessions(token: string) {
    return request<AuthSessionInfo[]>('/auth/sessions', { token });
  },
  revokeAuthSession(token: string, sessionId: number) {
    return request<{ status: string }>(`/auth/sessions/${sessionId}`, {
      method: 'DELETE',
      token,
    });
  },
  getTeacherDashboard(token: string) {
    return request<DashboardSummary>('/teacher/dashboard', { token });
  },
  getTeacherCourses(token: string) {
    return request<TeacherCourse[]>('/teacher/courses', { token });
  },
  getTeacherCourseStudents(token: string, courseId: number, day: string) {
    return request<CourseStudentAttendance[]>(`/teacher/courses/${courseId}/students?day=${encodeURIComponent(day)}`, { token });
  },
  markAttendance(
    token: string,
    items: Array<{ student_id: number; course_id: number; date: string; status: 'present' | 'absent' | 'late' }>,
  ) {
    return request<AttendanceRecord[]>('/teacher/attendance/mark', {
      method: 'POST',
      token,
      body: items,
    });
  },
  getTeacherStatistics(token: string) {
    return request<CourseAttendanceStat[]>('/teacher/statistics', { token });
  },
  getTeacherHomework(token: string, courseId?: number) {
    const query = courseId ? `?course_id=${courseId}` : '';
    return request<Homework[]>(`/teacher/homework${query}`, { token });
  },
  createHomework(token: string, formData: FormData) {
    return request<Homework>('/teacher/homework/create', {
      method: 'POST',
      token,
      body: formData,
    });
  },
  updateHomework(token: string, homeworkId: number, formData: FormData) {
    return request<Homework>(`/teacher/homework/${homeworkId}`, {
      method: 'PUT',
      token,
      body: formData,
    });
  },
  deleteHomework(token: string, homeworkId: number) {
    return request<{ status: string }>(`/teacher/homework/${homeworkId}`, {
      method: 'DELETE',
      token,
    });
  },
  getCourseWorkspace(token: string, courseId: number) {
    return request<CourseWorkspace>(`/teacher/courses/${courseId}/workspace`, { token });
  },
  updateCourseWorkspace(token: string, courseId: number, payload: { google_sheet_url: string | null }) {
    return request<CourseWorkspace>(`/teacher/courses/${courseId}/workspace`, {
      method: 'PUT',
      token,
      body: payload,
    });
  },
  createAssistantCode(token: string, courseId: number) {
    return request<AssistantInvite>(`/teacher/courses/${courseId}/assistant-code`, {
      method: 'POST',
      token,
    });
  },
  getCourseAssistants(token: string, courseId: number) {
    return request<CourseAssistant[]>(`/teacher/courses/${courseId}/assistants`, { token });
  },
  getHomeworkSubmissions(token: string, homeworkId: number) {
    return request<HomeworkSubmissionReview[]>(`/teacher/homework/${homeworkId}/submissions`, { token });
  },
  reviewHomeworkSubmission(
    token: string,
    submissionId: number,
    payload: { grade: number | null; feedback: string | null },
  ) {
    return request<HomeworkSubmissionReview>(`/teacher/homework/submissions/${submissionId}/review`, {
      method: 'PUT',
      token,
      body: payload,
    });
  },
  getMoodleStatus(token: string) {
    return request<MoodleStatus>('/moodle/status', { token });
  },
  testMoodleConnection(token: string) {
    return request<{ ok: boolean; message: string }>('/moodle/test-connection', {
      method: 'POST',
      token,
    });
  },
  syncMoodle(token: string) {
    return request<{ synced: number }>('/moodle/sync', {
      method: 'POST',
      token,
    });
  },
  getAdminUsers(token: string) {
    return request<User[]>('/admin/users', { token });
  },
  createAdminUser(
    token: string,
    payload: { name: string; email: string; password: string; role: 'student' | 'teacher' | 'admin'; group_id: number | null },
  ) {
    return request<User>('/admin/users', { method: 'POST', token, body: payload });
  },
  updateAdminUser(
    token: string,
    userId: number,
    payload: { name: string; email: string; role: 'student' | 'teacher' | 'admin'; group_id: number | null; telegram_id: string | null },
  ) {
    return request<User>(`/admin/users/${userId}`, { method: 'PUT', token, body: payload });
  },
  deleteAdminUser(token: string, userId: number) {
    return request<{ status: string }>(`/admin/users/${userId}`, { method: 'DELETE', token });
  },
  getAdminGroups(token: string) {
    return request<Group[]>('/admin/groups', { token });
  },
  createAdminGroup(token: string, payload: { name: string; course_id: number | null }) {
    return request<Group>('/admin/groups', { method: 'POST', token, body: payload });
  },
  updateAdminGroup(token: string, groupId: number, payload: { name: string; course_id: number | null }) {
    return request<Group>(`/admin/groups/${groupId}`, { method: 'PUT', token, body: payload });
  },
  deleteAdminGroup(token: string, groupId: number) {
    return request<{ status: string }>(`/admin/groups/${groupId}`, { method: 'DELETE', token });
  },
  getAdminCourses(token: string) {
    return request<Course[]>('/admin/courses', { token });
  },
  createAdminCourse(token: string, payload: { name: string; teacher_id: number; moodle_id: string | null }) {
    return request<Course>('/admin/courses', { method: 'POST', token, body: payload });
  },
  updateAdminCourse(token: string, courseId: number, payload: { name: string; teacher_id: number; moodle_id: string | null }) {
    return request<Course>(`/admin/courses/${courseId}`, { method: 'PUT', token, body: payload });
  },
  deleteAdminCourse(token: string, courseId: number) {
    return request<{ status: string }>(`/admin/courses/${courseId}`, { method: 'DELETE', token });
  },
  getStudentCourses(token: string) {
    return request<Array<{ id: number; name: string; teacher_id: number; teacher_name: string | null; moodle_id: string | null; group_id: number | null; group_name: string | null }>>('/student/courses', { token });
  },
  getStudentProfile(token: string) {
    return request<StudentProfile>('/student/profile', { token });
  },
  createTelegramLinkCode(token: string) {
    return request<{ code: string; expires_in_seconds: number }>('/auth/telegram/link-code', {
      method: 'POST',
      token,
    });
  },
  linkAssistantCode(token: string, code: string) {
    return request<{ status: string; course_id: number }>('/student/assistant/link', {
      method: 'POST',
      token,
      body: { code },
    });
  },
  getStudentAttendance(token: string) {
    return request<AttendanceRecord[]>('/student/attendance', { token });
  },
  getStudentHomework(token: string) {
    return request<Homework[]>('/student/homework', { token });
  },
  submitStudentHomework(token: string, homeworkId: number, formData: FormData) {
    return request<{ status: string; submission_id: number }>(`/student/homework/${homeworkId}/submit`, {
      method: 'POST',
      token,
      body: formData,
    });
  },
  getStudentNotifications(token: string) {
    return request<Notification[]>('/student/notifications', { token });
  },
};
