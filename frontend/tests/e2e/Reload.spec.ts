import { expect, test } from "@playwright/test";

import { setupClerkTestingToken, clerk } from "@clerk/testing/playwright";
import dotenv from "dotenv";

/**
  The general shapes of tests in Playwright Test are:
    1. Navigate to a URL
    2. Interact with the page
    3. Assert something about the page against your expectations
  Look for this pattern in the tests below!
 */

dotenv.config();
const url = "http://localhost:8000";

// If you needed to do something before every test case...
test.beforeEach(async ({ page }) => {
  test.setTimeout(30000);

  setupClerkTestingToken({ page });
  await page.goto(url);
  await clerk.loaded({ page });
  const loginButton = page.getByRole("button", { name: "Sign in" });
  await expect(loginButton).toBeVisible();

  // This logs in/out via _Clerk_, not via actual component interaction. But that's OK.
  // (Clerk's Playwright guide has an example of filling the login form itself.)
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      password: process.env.E2E_CLERK_USER3_PASSWORD!,
      identifier: process.env.E2E_CLERK_USER3_USERNAME!,
    },
  });
});

test("reload-display", async ({ page }) => {
  await page.goto("http://localhost:8000/");
  await page.getByRole("button", { name: "2" }).click();
  await expect(page.getByText("Fall 21")).toBeVisible();
  await expect(page.getByText("Spring 22")).toBeVisible();
  await page.getByRole("button", { name: "4" }).click();
  await expect(page.getByText("Fall 21")).toBeVisible();
  await expect(page.getByText("Spring 22")).toBeVisible();
  await expect(page.getByText("Fall 22")).toBeVisible();
  await expect(page.getByText("Spring 23")).toBeVisible();
  await page.goto("http://localhost:8000/");
  await expect(page.getByText("Fall 21")).toBeVisible();
  await expect(page.getByText("Spring 22")).toBeVisible();
  await expect(page.getByText("Fall 22")).toBeVisible();
  await expect(page.getByText("Spring 23")).toBeVisible();
});

test("reload-sidebar", async ({ page }) => {
  await expect(page.getByText("Concentration Requirements")).toBeVisible();
  await page.goto("http://localhost:8000/");
  await page.getByText("Concentration Requirements").click();
  await page.locator(".p-1\\.5").click();
  await expect(page.getByRole("complementary")).toBeVisible();
  await page.goto("http://localhost:8000/");
  await expect(page.getByRole("complementary")).toBeVisible();
  await page.getByRole("complementary").getByRole("button").click();
  await expect(page.getByText("Concentration Requirements")).toBeVisible();
});
