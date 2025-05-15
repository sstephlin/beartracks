import { test, expect } from "@playwright/test";
import { setupClerkTestingToken, clerk } from "@clerk/testing/playwright";
import dotenv from "dotenv";

dotenv.config();
// front-end server
const url = "http://localhost:8000";

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
      password: process.env.E2E_CLERK_USER4_PASSWORD!,
      identifier: process.env.E2E_CLERK_USER4_USERNAME!,
    },
  });
});

test('concentration reqs, concentration, and progress bar persists after reload', async ({ page }) => {
    // Initial checks before reload
    await expect(page.getByRole('complementary')).toContainText('1 out of 16 courses completed!');
    await expect(page.getByRole('banner')).toContainText('1 / 16');
    await expect(page.getByRole('main')).toContainText('EEPS 1000an eeps course');
    await expect(page.getByRole('main')).toContainText('CSCI 0111Computing Foundations: Data');
    await expect(page.getByRole('combobox')).toHaveValue('Computer Science Sc.B.');
    
    // Expand a requirement category if needed (e.g., "Intro Part 1")
    const expandButton = page.locator(
        '.concentration-category:has-text("Intro Part 1") .expand-button'
    );
    await expandButton.click();

    const completedCourse = await page.locator(
        'li.requirement_completed:has-text("CSCI 0111")'
    );
    await expect(completedCourse).toBeVisible();
    
    // check that cs111 in the sidebar turns green
    const color = await completedCourse.evaluate(
    (el) => getComputedStyle(el).color
    );
    expect(color).toBe("rgba(58, 94, 66, 0.824)"); // Equivalent to #3a5e42d2   
    
    // check that cs0150 is still black bc it's not in course plan
    const unfulfilledCourse = await page.locator(
        'li.requirement_not_completed:has-text("CSCI 0150")'
    );
    await expect(unfulfilledCourse).toBeVisible();

    const textColor = await unfulfilledCourse.evaluate(
        (el) => getComputedStyle(el).color
    );

    // Match rgb(0, 0, 0) = black
    expect(textColor).toMatch(/rgb\(0,\s*0,\s*0\)/);

    // Reload the page
    await page.reload();
  
    // Check that all critical state is still reflected in the UI
    await expect(page.getByRole('complementary')).toContainText('1 out of 16 courses completed!');
    await expect(page.getByRole('banner')).toContainText('1 / 16');
    await expect(page.getByRole('main')).toContainText('EEPS 1000an eeps course');
    await expect(page.getByRole('main')).toContainText('CSCI 0111Computing Foundations: Data');
    await expect(page.getByRole('combobox')).toHaveValue('Computer Science Sc.B.');
});
  