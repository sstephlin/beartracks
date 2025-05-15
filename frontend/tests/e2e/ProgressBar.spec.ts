import { expect, test } from "@playwright/test";
import { setupClerkTestingToken, clerk } from "@clerk/testing/playwright";
import dotenv from "dotenv";

dotenv.config();
const url = "http://localhost:8000";

// async function to log in and return progress bar value
async function getProgressBarValue(page: any, email: string, password: string): Promise<number> {
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

  const progressBar = page.locator("progress.logo-progress");
  await expect(progressBar).toBeVisible();

  const value = await progressBar.getAttribute("value");
  return parseInt(value || "0", 10);
}

test("user 1 and user 2 have different progress values", async ({ page }) => {
  test.setTimeout(30000);

  // user 5 login and progress
  const user5Progress = await getProgressBarValue(
    page,
    process.env.E2E_CLERK_USER5_USERNAME!,
    process.env.E2E_CLERK_USER5_PASSWORD!
  );

  // logs out before switching users
  await clerk.signOut({ page });

  // user 4 login and progress
  const user4Progress = await getProgressBarValue(
    page,
    process.env.E2E_CLERK_USER4_USERNAME!,
    process.env.E2E_CLERK_USER4_PASSWORD!
  );

  console.log("User 5 progress:", user5Progress);
  console.log("User 4 progress:", user4Progress);

  // verifies that the progress values are not the same
  expect(user5Progress).toBe(user4Progress);
});
