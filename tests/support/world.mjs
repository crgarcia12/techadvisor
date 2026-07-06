import { execSync } from "node:child_process";
import { setDefaultTimeout, setWorldConstructor, Before, After, BeforeAll } from "@cucumber/cucumber";
import { chromium } from "playwright";

setDefaultTimeout(60_000);

/**
 * Base URL of the running app. When Liliput runs these tests against the live
 * preview it passes the full (prefixed) preview URL via one of these env vars.
 * Falls back to a local server for developer runs.
 */
export const BASE_URL = (
  process.env.LILIPUT_PREVIEW_URL ||
  process.env.PREVIEW_URL ||
  process.env.BASE_URL ||
  process.env.APP_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

let browser;

BeforeAll(async function () {
  try {
    browser = await chromium.launch();
  } catch {
    // Self-heal: install the Chromium browser if it is missing, then retry.
    execSync("npx playwright install chromium", { stdio: "inherit" });
    browser = await chromium.launch();
  }
});

class TechAdvisorWorld {
  async open() {
    this.context = await browser.newContext();
    this.page = await this.context.newPage();
    await this.page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  }
  async close() {
    if (this.context) await this.context.close();
  }
}

setWorldConstructor(TechAdvisorWorld);

Before(async function () {
  this.lastUrl = null;
  this.lastPrice = null;
});

After(async function () {
  await this.close();
});
