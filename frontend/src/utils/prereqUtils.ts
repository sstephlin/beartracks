import { CourseItem } from "../types";
import { checkPrereqsFromCSV } from "./prerequisiteLoader";
// import.meta.env.VITE_BACKEND_URL;

export async function checkPrereqs(
  uid: string | null | undefined,
  courseCode: string,
  semesterId: string
): Promise<boolean | undefined> {
  // If no uid (user not signed in), use CSV-based prerequisite checking
  if (!uid || uid === "") {
    console.log("Using CSV prereq check for:", courseCode, semesterId);
    const result = await checkPrereqsFromCSV(courseCode, semesterId);
    // If undefined (no data), return undefined to indicate unknown status
    return result;
  }

  const [term, year] = semesterId.split(" ");
  console.log("course", courseCode, " semesterId: ", semesterId);
  const resp = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/check-prereqs?uid=${encodeURIComponent(
      uid
    )}&code=${encodeURIComponent(courseCode)}&term=${encodeURIComponent(
      term
    )}&year=${encodeURIComponent(year)}`,
    { method: "GET" }
  );
  const body = await resp.json();
  return body.prereqsMet as boolean;
}
