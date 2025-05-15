import { test, expect } from "@playwright/test";
import { setupClerkTestingToken, clerk } from "@clerk/testing/playwright";

// front-end server
const url = "http://localhost:8000";

test("login/logout", async ({ page }) => {
  test.setTimeout(30000);
  setupClerkTestingToken({ page });
  await page.goto(url);
  await clerk.loaded({ page });
  const loginButton = page.getByRole("button", { name: "sign in" });
  await expect(loginButton).toBeVisible();

  // This logs in/out via _Clerk_, not via actual component interaction. But that's OK.
  // (Clerk's Playwright guide has an example of filling the login form itself.)
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      password: process.env.E2E_CLERK_USER1_PASSWORD!,
      identifier: process.env.E2E_CLERK_USER1_USERNAME!,
    },
  });

  // Partial match by default
  const loginText = page.getByText("Welcome");
  await expect(loginText).toBeVisible();

  await clerk.signOut({ page });
});
