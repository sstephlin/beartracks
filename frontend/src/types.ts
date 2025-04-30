export interface CourseItem {
  id: string;
  courseCode: string;
  courseTitle: string;
  semesterId: string;
  isEditing?: boolean;
  prereqMet: boolean;
}
