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
    await expect(page.getByText(/Save the Date qui vous ressemble/i)).toBeVisible();
    await expect(page.getByText("par design")).toBeVisible();
    await expect(page.locator("#hero").getByRole("link", { name: /créer mon save the date/i })).toBeVisible();
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

  test("gallery CTAs carry their style to the upload step", async ({ page }) => {
    // Le CTA promet un style ("Créer en Bohème") : il doit le transmettre au tunnel.
    const cta = page.locator("#gallery").getByRole("link", { name: /créer en bohème/i });
    await expect(cta).toHaveAttribute("href", "/generate/upload?style=boheme");

    await page.goto("/generate/upload?style=vintage");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("siana-generation-store") ?? "{}")?.state
              ?.selectedTemplate ?? null
        )
      )
      .toBe("vintage");
  });

  test("upload step ignores an unknown style param", async ({ page }) => {
    // On pose d'abord un template valide, PUIS on tente le param invalide : une simple
    // assertion "reste null" passerait au vert même si la validation était supprimée
    // (le read peut précéder l'hydratation). Ici, si `not-a-template` était accepté,
    // il écraserait `vintage` — le test devient discriminant.
    const readTemplate = () =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("siana-generation-store") ?? "{}")?.state
            ?.selectedTemplate ?? null
      );

    await page.goto("/generate/upload?style=vintage");
    await expect.poll(readTemplate).toBe("vintage");

    await page.goto("/generate/upload?style=not-a-template");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect.poll(readTemplate).toBe("vintage");
  });

  test("testimonials section displays client reviews", async ({ page }) => {
    const section = page.locator("#testimonials");
    await expect(section).toBeVisible();
    const reviews = section.getByRole("article");
    await expect(reviews).toHaveCount(3);
  });

  test("navigation links point to correct sections", async ({ page }) => {
    // Scopé à la nav : le hero contient aussi un lien vers #how-it-works (flèche de
    // scroll, "Découvrir comment ça marche"), et getByRole matche par sous-chaîne.
    const nav = page.getByRole("navigation", { name: "Sections de la page" });
    await expect(nav.getByRole("link", { name: "Comment ça marche" })).toHaveAttribute("href", "#how-it-works");
    await expect(nav.getByRole("link", { name: "Galerie" })).toHaveAttribute("href", "#gallery");
    await expect(nav.getByRole("link", { name: "Témoignages" })).toHaveAttribute("href", "#testimonials");
  });
});
