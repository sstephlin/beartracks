import { CourseItem } from "../types";

const SESSION_STORAGE_KEY = "beartracks_session_data";

export interface SessionData {
  courses: CourseItem[];
  semesters: { [boxId: string]: string };
  capstoneId?: string;
  currentCapstoneCourse?: string;
  concentration?: string;
  expandedSidebar?: boolean;
  viewCount?: string;
  manualCourses?: string[];
}

export const sessionStorageUtils = {
  saveSessionData: (data: SessionData) => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save to session storage:", error);
    }
  },

  getSessionData: (): SessionData | null => {
    try {
      const data = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Failed to read from session storage:", error);
      return null;
    }
  },

  clearSessionData: () => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear session storage:", error);
    }
  },

  transferSessionDataToBackend: async (userId: string, backendUrl: string): Promise<boolean> => {
    try {
      const sessionData = sessionStorageUtils.getSessionData();
      if (!sessionData) return false;

      const { courses, semesters, capstoneId, concentration, expandedSidebar, viewCount } = sessionData;

      // First, add all semesters  
      for (const semester of Object.values(semesters)) {
        const [term, year] = semester.split(" ");
        await fetch(
          `${backendUrl}/add-semester?uid=${userId}&term=${term}&year=${year}`,
          { method: "POST" }
        );
      }

      // Then add all courses
      for (const course of courses) {
        const [term, year] = course.semesterId.split(" ");
        await fetch(
          `${backendUrl}/add-course?uid=${userId}&code=${encodeURIComponent(
            course.courseCode
          )}&title=${encodeURIComponent(course.title || "")}&term=${term}&year=${year}`,
          { method: "POST" }
        );

        // If this course is the capstone, update it
        if (capstoneId && course.id === capstoneId) {
          const query = new URLSearchParams({
            uid: userId,
            term,
            year,
            courseCode: course.courseCode,
          });

          await fetch(`${backendUrl}/update-capstone?${query.toString()}`, {
            method: "POST",
          });
        }
      }

      // Transfer concentration if it exists
      if (concentration) {
        await fetch(
          `${backendUrl}/store-concentration?uid=${userId}&concentration=${concentration}`,
          { method: "POST" }
        );
      }
      
      // Transfer expanded sidebar state if it exists
      if (expandedSidebar !== undefined) {
        await fetch(
          `${backendUrl}/store-expanded?uid=${userId}&expanded=${expandedSidebar}`,
          { method: "POST" }
        );
      }
      
      // Transfer view count if it exists
      if (viewCount) {
        await fetch(
          `${backendUrl}/store-view?uid=${userId}&view=${viewCount}`,
          { method: "POST" }
        );
      }

      // Clear session storage after successful transfer
      sessionStorageUtils.clearSessionData();
      return true;
    } catch (error) {
      console.error("Failed to transfer session data to backend:", error);
      return false;
    }
  },
};