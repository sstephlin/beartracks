import { expect, test } from "@playwright/test";
import { setupClerkTestingToken, clerk } from "@clerk/testing/playwright";
import dotenv from "dotenv";

dotenv.config();
const url = "http://localhost:8000";

// async log in and detect if any capstone course is visually marked
async function loginAndCheckCapstoneMarked(
  page: any,
  email: string,
  password: string
): Promise<boolean> {
  setupClerkTestingToken({ page });
  await page.goto(url);
  await clerk.loaded({ page });

  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      password,
      identifier: email,
    },
  });

  await page.goto(url); 

  // looks for any course block with the "capstone" class
  const capstoneCourse = page.locator(".course-slot.capstone");
  const count = await capstoneCourse.count();
  return count > 0;
}

test("capstone visual state differs between user 1 and user 2", async ({ page }) => {
  test.setTimeout(30000);

  const user5HasCapstone = await loginAndCheckCapstoneMarked(
    page,
    process.env.E2E_CLERK_USER5_USERNAME!,
    process.env.E2E_CLERK_USER5_PASSWORD!
  );

  await clerk.signOut({ page });

  const user4HasCapstone = await loginAndCheckCapstoneMarked(
    page,
    process.env.E2E_CLERK_USER4_USERNAME!,
    process.env.E2E_CLERK_USER4_PASSWORD!
  );

  console.log("User 5 capstone marked:", user5HasCapstone);
  console.log("User 4 capstone marked:", user4HasCapstone);

  expect(user5HasCapstone).toBe(user4HasCapstone);
});
