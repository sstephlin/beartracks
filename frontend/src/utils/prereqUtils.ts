import { CourseItem } from "../types";
// import.meta.env.VITE_BACKEND_URL;

export async function checkPrereqs(
  uid: string,
  courseCode: string,
  semesterId: string
): Promise<boolean> {
  const [term, year] = semesterId.split(" ");
  console.log("course", courseCode, " semesterId: ", semesterId);
  const resp = await fetch(
    `${
      process.env.REACT_APP_BACKEND_URL
    }/check-prereqs?uid=${encodeURIComponent(uid)}&code=${encodeURIComponent(
      courseCode
    )}&term=${encodeURIComponent(term)}&year=${encodeURIComponent(year)}`,
    { method: "GET" }
  );
  const body = await resp.json();
  return body.prereqsMet as boolean;
}
