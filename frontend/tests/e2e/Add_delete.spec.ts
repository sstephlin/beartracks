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
      password: process.env.E2E_CLERK_USER1_PASSWORD!,
      identifier: process.env.E2E_CLERK_USER1_USERNAME!,
    },
  });
});

// testing adding to the left via right click
test("add-left-delete", async ({ page }) => {
  await page.goto("http://localhost:8000/");
  //   make sure fall 21 is showing
  await expect(page.getByRole("main")).toContainText("Fall 21");
  await page
    .locator("div")
    .filter({ hasText: /^\+ New course$/ })
    .click({
      button: "right",
    });
  // add a sem to the left
  await page.getByText("Add Semester to the Left").click();
  await page
    .getByRole("main")
    .getByRole("combobox")
    .nth(1)
    .selectOption("Fall 22");
  // make sure both sems now show
  await expect(page.getByRole("main")).toContainText("Fall 22");
  await expect(page.getByRole("main")).toContainText("Fall 21");
  await page
    .locator("div")
    .filter({ hasText: /^\+ New course$/ })
    .first()
    .click({
      button: "right",
    });
  // reset planner
  await page.getByText("Delete Semester").click();
  //   make sure fall 21 is still showing
  await expect(page.getByRole("main")).toContainText("Fall 21");
});

// testing adding to the right via right click
test("add-right-delete", async ({ page }) => {
  await page.goto("http://localhost:8000/");
  //   make sure fall 21 is showing
  await expect(page.getByRole("main")).toContainText("Fall 21");
  await page
    .locator("div")
    .filter({ hasText: /^\+ New course$/ })
    .click({
      button: "right",
    });
  // add a sem to the right
  await page.getByText("Add Semester to the Right").click();
  await page
    .getByRole("main")
    .getByRole("combobox")
    .nth(1)
    .selectOption("Winter 21");
  // make sure both sems are showing
  await expect(page.getByRole("main")).toContainText("Fall 21");
  await expect(page.getByRole("main")).toContainText("Winter 21");
  await page
    .locator("div")
    .filter({ hasText: /^\+ New course$/ })
    .nth(1)
    .click({
      button: "right",
    });
  // reset planner
  await page.getByText("Delete Semester").click();
  //   make sure fall 21 is still showing
  await expect(page.getByRole("main")).toContainText("Fall 21");
});

// tests the add button
test("test", async ({ page }) => {
  await page.goto("http://localhost:8000/");
  //   add a sem
  await page.getByRole("button", { name: "+ New Semester" }).click();
  await page
    .getByRole("main")
    .getByRole("combobox")
    .nth(1)
    .selectOption("Fall 22");
  // make sure both are there
  await expect(page.getByRole("main")).toContainText("Fall 21");
  await expect(page.getByRole("main")).toContainText("Fall 22");
  await page
    .locator("div")
    .filter({ hasText: /^\+ New course$/ })
    .nth(1)
    .click({
      button: "right",
    });
  await page.getByText("Delete Semester").click();
  await expect(page.getByRole("main")).toContainText("Fall 21");
});
