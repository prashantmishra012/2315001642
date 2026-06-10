const axios = require("axios");

// Business priority weights
const INBOX_WEIGHT_RULES = {
  placement: 3,
  result: 2,
  event: 1,
};

/**
 * Normalizes type fields, assigns priorities, and resolves ties chronologically.
 */
function compilePriorityInbox(notificationCollection, displayLimit = 10) {
  if (!Array.isArray(notificationCollection)) return [];

  return notificationCollection
    .map((record) => {
      const normalizedType = String(
        record.Type || record.type || "",
      ).toLowerCase();
      return {
        id: record.ID || record.id,
        type: record.Type || record.type,
        message: record.Message || record.message,
        timestamp: record.Timestamp || record.timestamp,
        computedWeight: INBOX_WEIGHT_RULES[normalizedType] || 0,
        unixTimeMs: new Date(record.Timestamp || record.timestamp).getTime(),
      };
    })
    .sort((itemA, itemB) => {
      // Primary sort by weight
      if (itemB.computedWeight !== itemA.computedWeight) {
        return itemB.computedWeight - itemA.computedWeight;
      }
      // Tie-breaker: sort chronologically (newest first)
      return itemB.unixTimeMs - itemA.unixTimeMs;
    })
    .slice(0, displayLimit)
    .map(({ id, type, message, timestamp }) => ({
      id,
      type,
      message,
      timestamp,
    }));
}

async function executeEvaluationRunner() {
  const USER_ACCESS_TOKEN ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwcmFzaGFudC5taXNocmFfY3MyM0BnbGEuYWMuaW4iLCJleHAiOjE3ODEwODE2NjAsImlhdCI6MTc4MTA4MDc2MCwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6ImQwYmQ3NTM2LTM5MTItNDEwOC1iYTM2LTEyNzU3YzU4ZGM0OCIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InByYXNoYW50IGt1bWFyIG1pc2hyYSIsInN1YiI6IjlhNTUxMDlkLWViYzYtNGRjNC04ZmMwLTk2Zjc3YTE2NDIxOSJ9LCJlbWFpbCI6InByYXNoYW50Lm1pc2hyYV9jczIzQGdsYS5hYy5pbiIsIm5hbWUiOiJwcmFzaGFudCBrdW1hciBtaXNocmEiLCJyb2xsTm8iOiIyMzE1MDAxNjQyIiwiYWNjZXNzQ29kZSI6IlJQc2dZdCIsImNsaWVudElEIjoiOWE1NTEwOWQtZWJjNi00ZGM0LThmYzAtOTZmNzdhMTY0MjE5IiwiY2xpZW50U2VjcmV0IjoiTnlqZ3NIclJybWplUGZ0VyJ9.JhpRkgoofLvlQ9dxo8sz9tYLvpD2mwcQ6J2wKr25lOA";
  const INBOX_DISPLAY_LIMIT = 10;

  try {
    console.log("Ingesting notification streams from remote testing server...");
    const endpointResponse = await axios.get(
      "http://4.224.186.213/evaluation-service/notifications",
      {
        headers: {
          Authorization: `Bearer ${USER_ACCESS_TOKEN}`,
          Accept: "application/json",
        },
      },
    );

    const rawDataset =
      endpointResponse.data.notifications || endpointResponse.data;
    console.log(
      `Ingested ${rawDataset.length} notifications. Running ranking calculations...`,
    );

    const refinedPriorityInbox = compilePriorityInbox(
      rawDataset,
      INBOX_DISPLAY_LIMIT,
    );

    console.log(`\n=== TOP ${INBOX_DISPLAY_LIMIT} HIGHEST PRIORITY ALERTS ===`);
    console.table(refinedPriorityInbox);
  } catch (error) {
    console.error("Processing run terminated abnormally.");
    if (error.response) {
      console.error(`HTTP Error Code: ${error.response.status}`);
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

executeEvaluationRunner();
