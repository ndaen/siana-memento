import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page loads with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/Siana Memento/i);
  });

  test("hero section displays heading, tagline, price and CTA", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("15 minutes")).toBeVisible();
    await expect(page.getByText("par design")).toBeVisible();
    await expect(page.locator("#main-content").getByRole("link", { name: /créer mon save the date/i })).toBeVisible();
  });

  test("how-it-works section has 3 steps", async ({ page }) => {
    const section = page.locator("#how-it-works");
    await expect(section).toBeVisible();
    await expect(section.getByText("Uploadez vos photos")).toBeVisible();
    await expect(section.getByText("Choisissez votre style")).toBeVisible();
    await expect(section.getByText("Recevez votre illustration")).toBeVisible();
  });

  test("gallery section displays 5 template cards", async ({ page }) => {
    const section = page.locator("#gallery");
    await expect(section).toBeVisible();
    const cards = section.getByRole("article");
    await expect(cards).toHaveCount(5);
  });

  test("testimonials section displays client reviews", async ({ page }) => {
    const section = page.locator("#testimonials");
    await expect(section).toBeVisible();
    const reviews = section.getByRole("article");
    await expect(reviews).toHaveCount(3);
  });

  test("navigation links point to correct sections", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Comment ça marche" })).toHaveAttribute("href", "#how-it-works");
    await expect(page.getByRole("link", { name: "Galerie" })).toHaveAttribute("href", "#gallery");
    await expect(page.getByRole("link", { name: "Témoignages" })).toHaveAttribute("href", "#testimonials");
  });
});
