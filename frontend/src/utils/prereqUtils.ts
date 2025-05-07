import { CourseItem } from "../types";

export async function checkPrereqs(
  uid: string,
  courseCode: string,
  semesterId: string
): Promise<boolean> {
  const [term, year] = semesterId.split(" ");
  console.log("course", courseCode, " semesterId: ", semesterId);
  const resp = await fetch(
    `http://localhost:3232/check-prereqs?uid=${encodeURIComponent(
      uid
    )}&code=${encodeURIComponent(courseCode)}&term=${encodeURIComponent(
      term
    )}&year=${encodeURIComponent(year)}`,
    { method: "GET" }
  );
  const body = await resp.json();
  return body.prereqsMet as boolean;
}
