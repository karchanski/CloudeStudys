export type UserRole = 'student' | 'teacher' | 'admin';
export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  group_id: number | null;
  telegram_id: string | null;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthSessionInfo {
  id: number;
  created_at: string;
  expires_at: string;
  last_seen_at: string | null;
  user_agent: string | null;
  ip_address: string | null;
  revoked: boolean;
  is_current: boolean;
}

export interface TeacherCourse {
  id: number;
  name: string;
  teacher_id: number;
  teacher_name: string;
  moodle_id: string | null;
  group_names: string[];
  student_count: number;
  attendance_rate: number;
}

export interface Course {
  id: number;
  name: string;
  teacher_id: number;
  moodle_id: string | null;
}

export interface Group {
  id: number;
  name: string;
  course_id: number | null;
  course_name?: string | null;
  student_count?: number;
}

export interface DashboardSummary {
  courses_count: number;
  students_count: number;
  homework_count: number;
  attendance_rate_today: number;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  course_id: number;
  course_name?: string;
  date: string;
  status: AttendanceStatus;
}

export interface CourseStudentAttendance {
  student_id: number;
  student_name: string;
  group_id: number | null;
  group_name: string | null;
  status: AttendanceStatus | null;
}

export interface CourseAttendanceStat {
  course_id: number;
  course_name: string;
  present_percent: number;
  absent_percent: number;
  late_percent: number;
}

export interface Homework {
  id: number;
  course_id: number;
  course_name?: string;
  title: string;
  description: string;
  file_url: string | null;
  created_at: string;
  submission_id?: number | null;
  submission_file_url?: string | null;
  submitted_at?: string | null;
  grade?: number | null;
  feedback?: string | null;
  graded_at?: string | null;
}

export interface Notification {
  id: number;
  user_id: number;
  message: string;
  created_at: string;
}

export interface StudentProfile {
  id: number;
  name: string;
  email: string;
  group_id: number | null;
  group_name: string | null;
  telegram_id: string | null;
  courses_count: number;
  homework_count: number;
  attendance_percent: number;
  notifications_count: number;
  assistant_courses_count: number;
}

export interface MoodleSyncLog {
  started_at: string;
  finished_at: string | null;
  status: string;
  synced: number;
  message: string;
}

export interface MoodleStatus {
  base_url: string;
  auth_mode: string;
  has_token: boolean;
  has_credentials: boolean;
  last_sync: MoodleSyncLog | null;
  recent_logs: MoodleSyncLog[];
}

export interface AssistantInvite {
  code: string;
  course_id: number;
  expires_at: string;
}

export interface CourseAssistant {
  student_id: number;
  student_name: string;
  student_email: string;
  linked_at: string;
}

export interface CourseWorkspace {
  course_id: number;
  course_name: string;
  google_sheet_url: string | null;
  moodle_id: string | null;
}

export interface HomeworkSubmissionReview {
  submission_id: number;
  homework_id: number;
  homework_title: string;
  course_id: number;
  course_name: string;
  student_id: number;
  student_name: string;
  file_url: string;
  submitted_at: string;
  reviewer_id: number | null;
  grade: number | null;
  feedback: string | null;
  graded_at: string | null;
}
