export interface Student {
  student_id: string;
  name: string;
}

export interface Assignment {
  assignment_id: string;
  day_text: string;
  assignment_title: string;
  is_mandatory: boolean;
  description: string;
  assignment_category?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Submission {
  submission_id: string;
  student_id: string;
  name?: string;
  assignment_id: string;
  day_text?: string;
  assignment_title?: string;
  is_mandatory?: boolean;
  description?: string;
  attachments_url: string[];
  status: '待批改' | '批改中' | '合格' | '不合格' | '批改失败';
  feedback?: string;
  graduation_status?: string;
  submission_date: string;
  created_at?: string;
  updated_at?: string;
  
  // 中文字段名兼容
  '学号'?: string;
  '姓名'?: string;
  '第几天'?: string;
  '具体作业'?: string;
  '必做/选做'?: string;
  '作业详细要求'?: string;
  '学员提交的作业'?: string[];
  'AI的作业评估'?: string;
  '毕业合格统计'?: string;
}

export interface SubmissionWithAssignment extends Submission {
  assignment: Assignment;
}

// 毕业统计接口
export interface GraduationStats {
  total_assignments: number;
  mandatory_assignments: number;
  optional_assignments: number;
  completed_assignments: number;
  passed_assignments: number;
  failed_assignments: number;
  pending_assignments: number;
  completion_rate: number;
  pass_rate: number;
  is_eligible: boolean;
  missing_mandatory: Assignment[];
  // 新的毕业标准相关统计
  mandatory_passed: boolean;
  first_week_afternoon_optional_count: number;
  first_week_afternoon_passed: number;
  first_week_afternoon_qualified: boolean;
  other_optional_count: number;
  other_optional_passed: number;
  other_optional_qualified: boolean;
}