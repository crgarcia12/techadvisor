import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";

// ---- Background ------------------------------------------------------------

Given("the TechAdvisor app is running", async function () {
  // Nothing to start here; the app runs at BASE_URL (live preview or local).
});

Given("I open the app in a browser", async function () {
  await this.open();
});

Then("I see a chat pane and a comparison table pane", async function () {
  await expect(this.page.getByTestId("chat-pane")).toBeVisible();
  await expect(this.page.getByTestId("table-pane")).toBeVisible();
});

// Alias used by the "not configured" scenario.
Given("the app is started without Azure AI Foundry credentials", async function () {
  await this.open();
});

Given("the assistant has asked about screen size", async function () {
  // Contextual precondition — no explicit action required.
});

// ---- Chat ------------------------------------------------------------------

async function sendChat(page, text) {
  await page.getByTestId("chat-input").fill(text);
  await page.getByTestId("chat-send").click();
}

When("I type {string} in the chat and send it", async function (text) {
  await sendChat(this.page, text);
});

When("I open the app and type {string} and send it", async function (text) {
  if (!this.page) await this.open();
  await sendChat(this.page, text);
});

Then("the assistant replies with a question mentioning {string}", async function (word) {
  const messages = this.page.getByTestId("chat-messages");
  await expect(messages).toContainText(word, { timeout: 20_000 });
  await expect(messages).toContainText("?", { timeout: 20_000 });
});

Then("I see a clear message stating that the Azure AI Foundry configuration is missing", async function () {
  await expect(this.page.getByTestId("config-missing")).toBeVisible({ timeout: 20_000 });
  await expect(this.page.getByTestId("config-missing")).toContainText("Azure AI Foundry");
});

Then("the app remains usable without crashing", async function () {
  // The chat input is still interactive and the table pane is still present.
  await expect(this.page.getByTestId("chat-input")).toBeEnabled();
  await expect(this.page.getByTestId("table-pane")).toBeVisible();
});

// ---- Products --------------------------------------------------------------

async function addProduct(world, url, price) {
  world.lastUrl = url;
  world.lastPrice = price;
  await world.page.getByTestId("product-url").fill(url);
  await world.page.getByTestId("product-price").fill(price);
  await world.page.getByTestId("product-add").click();
}

When("I add a product with url {string} and price {string}", async function (url, price) {
  await addProduct(this, url, price);
});

Given("I added a product with url {string} and price {string}", async function (url, price) {
  await addProduct(this, url, price);
  await expect(this.page.getByTestId("comparison-table")).toContainText(url, { timeout: 20_000 });
});

Then("a new column for that product appears in the comparison table", async function () {
  await expect(this.page.getByTestId("comparison-table")).toContainText(this.lastUrl, { timeout: 20_000 });
});

Then("the product column shows an animated magnifying-glass researching indicator", async function () {
  await expect(this.page.locator(".glasses").first()).toBeVisible({ timeout: 20_000 });
});

// ---- Research completion ---------------------------------------------------

async function waitForResearchComplete(page) {
  // All per-product researching indicators and cell spinners have cleared.
  await page.waitForFunction(
    () => document.querySelectorAll('[data-testid^="researching-"], .glasses').length === 0,
    undefined,
    { timeout: 30_000 },
  );
}

When("the research for that product completes", async function () {
  await waitForResearchComplete(this.page);
});

Given("its research has completed", async function () {
  await waitForResearchComplete(this.page);
});

Then("the magnifying-glass indicator is no longer shown for that product", async function () {
  await expect(this.page.locator(".glasses")).toHaveCount(0, { timeout: 30_000 });
});

Then("the comparison table shows a {string} row with a value for that product", async function (metric) {
  const row = this.page.getByTestId(`row-${metric}`);
  await expect(row).toBeVisible({ timeout: 20_000 });
  // At least one metric-value cell has real text.
  await expect(row.locator(".metric-value").first()).toBeVisible({ timeout: 20_000 });
});

Then("the comparison table shows the price {string} for that product", async function (price) {
  await expect(this.page.getByText(price, { exact: false }).first()).toBeVisible();
  const priceRow = this.page.getByTestId("row-Price");
  await expect(priceRow).toContainText(price);
});

// ---- Missing metric omission ----------------------------------------------

When("the crawler did not find a {string} value on the page", async function (_metric) {
  // Fact about the fixture page; asserted in the following step.
});

Then("the comparison table does not show a {string} value for that product", async function (metric) {
  // Row is either absent entirely, or present with no real value cell.
  const row = this.page.getByTestId(`row-${metric}`);
  const count = await row.count();
  if (count > 0) {
    await expect(row.locator(".metric-value")).toHaveCount(0);
  }
});

// ---- Second product live update -------------------------------------------

Then("a second product column appears without a full page reload", async function () {
  await expect(this.page.getByTestId("comparison-table")).toContainText(this.lastUrl, { timeout: 20_000 });
  const headers = this.page.locator('[data-testid^="product-col-"]');
  await expect(headers).toHaveCount(2, { timeout: 20_000 });
});

Then(
  "shared metrics such as {string} align in the same row for both products",
  async function (metric) {
    await waitForResearchComplete(this.page);
    const row = this.page.getByTestId(`row-${metric}`);
    await expect(row).toBeVisible();
    // Two product value cells present on the same row.
    await expect(row.locator(".metric-value")).toHaveCount(2, { timeout: 20_000 });
  },
);
