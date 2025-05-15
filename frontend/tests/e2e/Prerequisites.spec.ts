import { test, expect } from "@playwright/test";
import { setupClerkTestingToken, clerk } from "@clerk/testing/playwright";
import dotenv from "dotenv";

dotenv.config();
// front-end server
const url = "http://localhost:8000";

// test.beforeEach(async ({ page }) => {
//   test.setTimeout(30000);
//   setupClerkTestingToken({ page });
//   await page.goto(url);
//   await clerk.loaded({ page });
//   const loginButton = page.getByRole("button", { name: "Sign in" });
//   await expect(loginButton).toBeVisible();

//   // This logs in/out via _Clerk_, not via actual component interaction. But that's OK.
//   // (Clerk's Playwright guide has an example of filling the login form itself.)
//   await clerk.signIn({
//     page,
//     signInParams: {
//       strategy: "password",
//       password: process.env.E2E_CLERK_USER3_PASSWORD!,
//       identifier: process.env.E2E_CLERK_USER3_USERNAME!,
//     },
//   });
// });

test("check prereqmet is true for courses without prereqs", async ({
  page,
}) => {
  setupClerkTestingToken({ page });
  await page.goto(url);
  await clerk.loaded({ page });

  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      password: process.env.E2E_CLERK_USER3_PASSWORD!,
      identifier: process.env.E2E_CLERK_USER3_USERNAME!,
    },
  });

  await page.goto("http://localhost:8000/");
  const courseBox = await page.locator(
    '.course-slot.filled.pr-met:has-text("CSCI 0150")'
  );
  await expect(courseBox).toBeVisible();

  const borderColor = await courseBox.evaluate(
    (el) => getComputedStyle(el).borderColor
  );
  expect(borderColor).toMatch(/rgb\(76,\s*175,\s*80\)/); // matches #4caf50
});

test("check prereq for a course with one prereq", async ({ page }) => {
  setupClerkTestingToken({ page });
  await page.goto(url);
  await clerk.loaded({ page });

  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      password: process.env.E2E_CLERK_USER3_PASSWORD!,
      identifier: process.env.E2E_CLERK_USER3_USERNAME!,
    },
  });

  await page.goto("http://localhost:8000/");
  // CSCI 0150 and CSCI 0200 is visible
  const courseBox = await page.locator(
    '.course-slot.filled.pr-met:has-text("CSCI 0150")'
  );
  await expect(courseBox).toBeVisible();
  const courseBox2 = await page.locator(
    '.course-slot.filled.pr-met:has-text("CSCI 0200")'
  );
  await expect(courseBox2).toBeVisible();

  // CSCI 0200's prereq is met
  const borderColor = await courseBox2.evaluate(
    (el) => getComputedStyle(el).borderColor
  );
  expect(borderColor).toMatch(/rgb\(76,\s*175,\s*80\)/); // matches #4caf50
});

// this is not working
// test("check something and clean up", async ({ page }) => {
//   await page.goto(url);

//   // 1. Add course via API
//   await page.request.post("http://localhost:3232/remove-course", {
//     params: {
//       uid: "user_2x6ZMuT1e8awwUW726FAYwiiLnN",
//       title: "CSCI 0111",
//       term: "Spring",
//       year: "2024",
//     },
//   });

//   // 2. Reload the page to reflect the new course visually
//   await page.reload();

//   // 3. Now test that the course is visible in the UI
//   const courseBox = page.locator('.course-slot.filled:has-text("CSCI 0111")');
//   await expect(courseBox).toBeVisible();
// });

test("check that a course with unfulfilled prereq is red", async ({
  page,
}) => {
  setupClerkTestingToken({ page });
  await page.goto(url);
  await clerk.loaded({ page });

  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      password: process.env.E2E_CLERK_USER2_PASSWORD!,
      identifier: process.env.E2E_CLERK_USER2_USERNAME!,
    },
  });

  await page.goto("http://localhost:8000/");

  const courseBox2 = await page.locator(
    '.course-slot.filled.pr-not-met:has-text("CSCI 0200")'
  );
  await expect(courseBox2).toBeVisible();

  // CSCI 0200's prereq is not met
  const borderColor2 = await courseBox2.evaluate(
    (el) => getComputedStyle(el).borderColor
  );
  expect(borderColor2).toMatch(/rgb\(244,\s*67,\s*54\)/); // matches #f44336 (red)
});


test("check prereq for a course with one prereq and remove the prereq to check it updates", async ({
  page,
}) => {
  setupClerkTestingToken({ page });
  await page.goto(url);
  await clerk.loaded({ page });

  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      password: process.env.E2E_CLERK_USER2_PASSWORD!,
      identifier: process.env.E2E_CLERK_USER2_USERNAME!,
    },
  });

  await page.goto("http://localhost:8000/");
  // CSCI 0150 and CSCI 0200 is visible
  const courseBox = await page.locator(
    '.course-slot.filled.pr-met:has-text("CSCI 0150")'
  );
  await expect(courseBox).toBeVisible();
  const courseBox2 = await page.locator(
    '.course-slot.filled.pr-met:has-text("CSCI 0200")'
  );
  await expect(courseBox2).toBeVisible();

  // CSCI 0200's prereq is met
  const borderColor = await courseBox.evaluate(
    (el) => getComputedStyle(el).borderColor
  );
  expect(borderColor).toMatch(/rgb\(76,\s*175,\s*80\)/); // matches #4caf50 (green)

  // remove CSCI 0150
  const courseBox3 = await page.locator(
    '.course-slot.filled.pr-met:has-text("CSCI 0150")'
  );
  const trashZone = await page.locator(".trash-area"); // TODO: this doesn't work. once someone gets remove working can you fix this? 
  await courseBox3.dragTo(trashZone);

  await expect(courseBox3).not.toBeVisible();

  // CSCI 0200's prereq is not met
  const borderColor2 = await courseBox2.evaluate(
    (el) => getComputedStyle(el).borderColor
  );
  expect(borderColor2).toMatch(/rgb\(244,\s*67,\s*54\)/); // matches #f44336 (red)

  // add it back before test ends
  const searchBar = await page.locator(".search-bar-input");
  await searchBar.fill("CSCI 0111");
  await page.waitForTimeout(1000); // Give search time to react

  // Click course in search results
  const courseToAdd = await page.locator('.search-course:has-text("CSCI 0150")');
  await courseToAdd.click();
});

/**
 * need to check these cases:
 * add cs15, cs200, cs1230, remove cs150, check cs200 and cs1230 turn red
 *
 */