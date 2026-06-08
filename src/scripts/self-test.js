import { SAVE_KEY } from "./data.js";

const SELF_TEST_QUERY_PARAM = "self-test";
const SELF_TEST_RESET_MARKER = "__zoodoku_self_test_reset__";
const SELF_TEST_RESULT_ID = "self-test-results";

const query = new URLSearchParams(window.location.search);

if (query.has(SELF_TEST_QUERY_PARAM)) {
    bootstrapSelfTest();
}

function bootstrapSelfTest() {
    if (!sessionStorage.getItem(SELF_TEST_RESET_MARKER)) {
        sessionStorage.setItem(SELF_TEST_RESET_MARKER, "1");
        try {
            localStorage.removeItem(SAVE_KEY);
        } catch (error) {
            console.warn("Self-test localStorage reset skipped.", error);
        }
        window.location.reload();
        return;
    }

    sessionStorage.removeItem(SELF_TEST_RESET_MARKER);

    const capturedErrors = [];
    window.addEventListener("error", event => {
        capturedErrors.push(event.error?.message || event.message || "Unknown window error");
    });
    window.addEventListener("unhandledrejection", event => {
        capturedErrors.push(event.reason?.message || String(event.reason || "Unhandled promise rejection"));
    });

    const start = () => {
        runSelfTest(capturedErrors).catch(error => {
            publishSelfTestResult("failed", {
                error: error?.stack || error?.message || String(error),
                runtimeErrors: capturedErrors
            });
        });
    };

    if (document.readyState === "complete") {
        setTimeout(start, 0);
    } else {
        window.addEventListener("load", start, { once: true });
    }
}

async function runSelfTest(capturedErrors) {
    const completedChecks = [];

    publishSelfTestResult("running", { completedChecks, runtimeErrors: capturedErrors });

    await waitFor(() => document.querySelectorAll("#grid-container [data-cell-key]").length > 0, {
        message: "initial puzzle grid to render"
    });
    completedChecks.push("booted puzzle grid");

    await waitFor(() => readText("#tutorial-step-indicator") === "Intro 1/5", {
        message: "FTUE to start on Intro 1/5"
    });
    completedChecks.push("entered tutorial intro");

    click("#tutorial-dismiss-btn");
    await waitFor(() => readText("#tutorial-step-indicator") === "Intro 2/5", {
        message: "tutorial to advance to Intro 2/5"
    });
    completedChecks.push("advanced tutorial to step 2");

    click("#tutorial-dismiss-btn");
    await waitFor(() => readText("#tutorial-step-indicator") === "Intro 3/5", {
        message: "tutorial to advance to Intro 3/5"
    });
    completedChecks.push("advanced tutorial to step 3");

    const markCellId = getHighlightedCellId();
    click(`#${markCellId}`);
    await waitFor(() => readText("#tutorial-step-indicator") === "Intro 4/5", {
        message: "tutorial to advance to Intro 4/5 after single tap"
    });
    completedChecks.push("placed tutorial X marker");

    const placeCellId = getHighlightedCellId();
    click(`#${placeCellId}`);
    await wait(120);
    click(`#${placeCellId}`);
    await waitFor(() => readText("#tutorial-step-indicator") === "Intro 5/5", {
        message: "tutorial to advance to Intro 5/5 after double tap"
    });
    completedChecks.push("placed tutorial animal");

    click("#tutorial-dismiss-btn");
    await waitFor(() => document.getElementById("tutorial-overlay")?.classList.contains("hidden"), {
        message: "tutorial overlay to dismiss"
    });
    completedChecks.push("dismissed tutorial overlay");

    const coinsBeforeReveal = Number(readText("#coin-counter"));
    click('[data-action="reveal-species"]');
    await waitFor(() => Number(readText("#coin-counter")) === coinsBeforeReveal - 50, {
        message: "coins to drop after reveal"
    });
    await waitFor(() => readText("#reveal-cost-badge").includes("100"), {
        message: "reveal cost to increment to 100"
    });
    assert(document.querySelectorAll("#grid-container .animal-head__image").length >= 3, "expected at least three solved animals after reveal");
    completedChecks.push("verified reveal power-up state");

    window.__zoodokuTestApi.applyLevelSelection(8);
    await waitFor(() => !document.getElementById("fierce-warning-modal")?.classList.contains("hidden"), {
        message: "hard-level warning modal to appear"
    });
    completedChecks.push("opened hard-level warning");

    click("#fierce-warning-cta");
    await waitFor(() => document.getElementById("fierce-warning-modal")?.classList.contains("hidden"), {
        timeoutMs: 5000,
        message: "hard-level warning modal to close"
    });
    await waitFor(() => document.getElementById("game-view")?.classList.contains("hard-mode"), {
        message: "hard mode styling to apply after warning confirm"
    });
    await waitFor(() => document.querySelectorAll("#grid-container [data-cell-key]").length === 49, {
        timeoutMs: 5000,
        message: "hard-level grid to rebuild at 7x7 after warning confirm"
    });
    completedChecks.push("confirmed hard-level warning");

    window.__zoodokuTestApi.applyLevelSelection(2);
    await waitFor(() => document.querySelectorAll("#grid-container [data-cell-key]").length === 25, {
        timeoutMs: 5000,
        message: "level 2 grid to rebuild at 5x5"
    });
    const correctPlacements = window.__zoodokuTestApi.getCorrectPlacements();
    const solutionKeys = new Set(correctPlacements.map(([row, col]) => `${row}-${col}`));
    let failedGuessCell = null;
    for (let row = 0; row < 5 && !failedGuessCell; row++) {
        for (let col = 0; col < 5; col++) {
            if (!solutionKeys.has(`${row}-${col}`)) {
                failedGuessCell = { row, col, selector: `#cell-${row}-${col}` };
                break;
            }
        }
    }
    assert(failedGuessCell, "expected a non-solution cell for failed-guess lock test");

    click(failedGuessCell.selector);
    await wait(120);
    click(failedGuessCell.selector);
    await waitFor(() => window.__zoodokuTestApi.getGridValue(failedGuessCell.row, failedGuessCell.col) === 3, {
        timeoutMs: 2000,
        message: "failed guess cell to become locked"
    });
    await wait(900);
    click(failedGuessCell.selector);
    await wait(120);
    click(failedGuessCell.selector);
    assert(window.__zoodokuTestApi.getGridValue(failedGuessCell.row, failedGuessCell.col) === 3, "expected failed guess cell to remain locked after retry");
    completedChecks.push("locked failed guess cell against future edits");

    await waitFor(() => typeof window.__zoodokuTestApi?.applyLevelSelection === "function", {
        message: "self-test level selection hook"
    });
    window.__zoodokuTestApi.applyLevelSelection(4, { zooFtue: true, openZoo: true });
    await waitFor(() => !document.getElementById("zoo-welcome-panel")?.classList.contains("hidden"), {
        message: "zoo welcome panel to appear"
    });
    click('[data-action="finish-zoo-welcome"]');
    await waitFor(() => readText("#tutorial-step-indicator") === "Step 1/3", {
        message: "zoo tutorial to start on Step 1/3"
    });
    completedChecks.push("entered zoo tutorial");

    click('#animal-card-elephant [data-action="favorite-mascot"]');
    await waitFor(() => readText("#tutorial-step-indicator") === "Step 2/3", {
        message: "zoo tutorial to advance after favorite tap"
    });
    assert(readText("#animal-card-lion").includes("10/10"), "expected lion FTUE card to show full shard requirement");
    assert(readText('#animal-card-lion [data-action="upgrade-animal"]').includes("FREE"), "expected lion FTUE upgrade button to show FREE");
    completedChecks.push("advanced zoo tutorial after favorite");

    click('#animal-card-lion [data-action="upgrade-animal"]');
    await waitFor(() => readText("#tutorial-step-indicator") === "Step 3/3", {
        message: "zoo tutorial to advance after free upgrade"
    });
    await waitFor(() => document.getElementById("tutorial-scrim")?.classList.contains("hidden"), {
        message: "zoo tutorial scrim to hide on Step 3/3"
    });
    await waitFor(() => !readText('#animal-card-lion [data-action="upgrade-animal"]').includes("FREE"), {
        message: "lion upgrade button to revert from FREE after FTUE"
    });
    completedChecks.push("reverted lion free upgrade label after FTUE");

    publishSelfTestResult("passed", {
        completedChecks,
        finalCoins: Number(readText("#coin-counter")),
        finalLevel: readText("#level-number"),
        revealCost: readText("#reveal-cost-badge"),
        runtimeErrors: capturedErrors
    });
}

function getHighlightedCellId() {
    const highlightedCell = document.querySelector("#grid-container .tutorial-highlighted[id]");
    assert(highlightedCell?.id, "expected a highlighted tutorial grid cell");
    return highlightedCell.id;
}

function click(selector) {
    const element = document.querySelector(selector);
    assert(element, `expected element for selector: ${selector}`);
    element.click();
}

function readText(selector) {
    const element = document.querySelector(selector);
    assert(element, `expected text source for selector: ${selector}`);
    return element.innerText.trim();
}

function publishSelfTestResult(status, payload) {
    const resultEl = ensureResultElement();
    resultEl.dataset.selfTestStatus = status;
    resultEl.textContent = encodeURIComponent(JSON.stringify(payload));
}

function ensureResultElement() {
    let resultEl = document.getElementById(SELF_TEST_RESULT_ID);
    if (resultEl) return resultEl;

    resultEl = document.createElement("pre");
    resultEl.id = SELF_TEST_RESULT_ID;
    resultEl.dataset.selfTestStatus = "idle";
    resultEl.hidden = true;
    document.body.appendChild(resultEl);
    return resultEl;
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function wait(timeoutMs) {
    return new Promise(resolve => {
        window.setTimeout(resolve, timeoutMs);
    });
}

async function waitFor(predicate, { timeoutMs = 4000, intervalMs = 50, message = "condition" } = {}) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        if (predicate()) return;
        await wait(intervalMs);
    }

    throw new Error(`Timed out waiting for ${message}.`);
}
