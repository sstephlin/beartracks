export interface CourseItem {
  id: string;
  courseCode: string;
  title: string;
  semesterId: string;
  isEditing?: boolean;
  prereqsMet: boolean;
  isCapstone?: boolean;
  showCapstoneCheckbox?: boolean;
  isManual?: boolean;
}
