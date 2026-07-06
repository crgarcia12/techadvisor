import { execSync } from "node:child_process";
import { setDefaultTimeout, setWorldConstructor, Before, After, BeforeAll, AfterAll } from "@cucumber/cucumber";
import { chromium } from "playwright";

setDefaultTimeout(60_000);

// Launch flags that make Chromium reliable in containerized CI runners (running
// as root, no /dev/shm). Without --no-sandbox, launch can hang or fail there.
const LAUNCH_OPTS = { args: ["--no-sandbox", "--disable-dev-shm-usage"] };

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
    browser = await chromium.launch(LAUNCH_OPTS);
  } catch {
    // Self-heal: install the Chromium browser (and its OS deps) if missing.
    try {
      execSync("npx playwright install --with-deps chromium", { stdio: "inherit" });
    } catch {
      execSync("npx playwright install chromium", { stdio: "inherit" });
    }
    browser = await chromium.launch(LAUNCH_OPTS);
  }
});

// Close the browser so the launched Chromium subprocess does not keep the Node
// event loop alive after all scenarios finish. Without this, cucumber-js passes
// every scenario but the process never exits and an external watchdog kills it.
AfterAll(async function () {
  if (browser) await browser.close();
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
