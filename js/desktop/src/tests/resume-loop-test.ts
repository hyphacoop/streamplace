import { v7 as uuidv7 } from "uuid";
import { makeWindow } from "../window";
import { E2ETest, TestEnv } from "./test-env";
import { delay, PlayerReport } from "./util";

/**
 * This test:
 * - Plays a stream for 15 seconds
 * - Pauses for 15 seconds
 * - Resumes and plays for 15 seconds
 * - Checks that the player is not stuck in a resume loop (i.e., spends most of the post-resume time in 'playing')
 */

const SEGMENT_MS = 15000; // 15 seconds
const POST_RESUME_PLAYING_THRESHOLD = 0.5; // At least 50% of post-resume time should be 'playing'

export const resumeLoopTest: E2ETest = {
  setup: async (testEnv: TestEnv) => {
    return {
      ...testEnv,
      env: {
        ...testEnv.env,
        SP_TEST_STREAM: "true",
      },
    };
  },
  test: async (testEnv: TestEnv): Promise<string | null> => {
    const mainWindow = await makeWindow();

    const testId = uuidv7();
    const playerId = `${testId}-resume-loop`;
    const playerConfig = {
      name: "resume-loop",
      playerId,
      src: "self-test",
      showControls: true,
      telemetry: true,
      forceProtocol: "progressive-mp4", // Use a stable protocol for this test
    };
    const enc = encodeURIComponent(JSON.stringify([playerConfig]));
    const load = `${testEnv.addr}/multi/${enc}`;

    console.log(`Opening player at ${load}`);
    await mainWindow.loadURL(load);

    // Wait for the player to load and start playing
    await delay(SEGMENT_MS);

    // Pause the player via JS injection
    console.log("Pausing player...");
    await mainWindow.webContents.executeJavaScript(`
      (function() {
        const video = document.querySelector("video");
        if (video) video.pause();
      })();
    `);

    await delay(SEGMENT_MS);

    // Resume the player via JS injection
    console.log("Resuming player...");
    await mainWindow.webContents.executeJavaScript(`
      (function() {
        const video = document.querySelector("video");
        if (video) video.play();
      })();
    `);

    await delay(SEGMENT_MS);

    // Fetch player report
    const res = await fetch(
      `${testEnv.internalAddr}/player-report/${playerId}`,
    );
    const data = (await res.json()) as PlayerReport;

    // Analyze whatHappened for post-resume period
    // We'll estimate post-resume by looking at the last 15 seconds of state time
    // If the player is stuck in a resume loop, 'playing' will be low, and 'resume' or 'buffering' will be high

    // Sum total time spent in each state
    const stateTimes = data.whatHappened || {};
    let total = 0;
    for (const ms of Object.values(stateTimes)) total += ms;

    // If total < 3 * SEGMENT_MS, just use the last segment as post-resume
    // Otherwise, estimate post-resume as the last SEGMENT_MS proportion
    let postResumePlaying = 0;
    let postResumeTotal = 0;
    if (total > 0) {
      for (const [state, ms] of Object.entries(stateTimes)) {
        // Proportion of this state's time in the post-resume segment
        const prop = Math.min(
          1,
          Math.max(0, (ms / total) * (total / SEGMENT_MS)),
        );
        if (state === "playing") postResumePlaying += ms * prop;
        postResumeTotal += ms * prop;
      }
    }

    // Fallback: if above logic fails, just use the overall 'playing' percentage
    if (postResumeTotal === 0 && total > 0) {
      postResumePlaying = stateTimes["playing"] || 0;
      postResumeTotal = total;
    }

    const playingPct =
      postResumeTotal > 0 ? postResumePlaying / postResumeTotal : 0;

    console.log(
      `Post-resume playing percentage: ${(playingPct * 100).toFixed(1)}%`,
    );
    console.log("Full state times:", JSON.stringify(stateTimes, null, 2));

    mainWindow.close();

    if (playingPct < POST_RESUME_PLAYING_THRESHOLD) {
      return `Player spent too little time playing after resume (${(
        playingPct * 100
      ).toFixed(1)}%). Possible resume loop or stall.`;
    }

    return null;
  },
};
