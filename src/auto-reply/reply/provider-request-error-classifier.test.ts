import { describe, expect, it } from "vitest";
import {
  classifyProviderRequestError,
  PROVIDER_CONVERSATION_STATE_ERROR_USER_MESSAGE,
  PROVIDER_INVALID_ARGUMENT_USER_MESSAGE,
} from "./provider-request-error-classifier.js";

describe("provider request error classifier", () => {
  it.each([
    [
      "OpenAI missing custom tool output",
      "Custom tool call output is missing for call id: call_live_123.",
    ],
    [
      "Bedrock tool result count mismatch",
      "The number of toolResult blocks at messages.186.content exceeds the number of toolUse blocks of previous turn.",
    ],
    [
      "Gemini function-call ordering mismatch",
      "400 Function call turn comes immediately after a user turn or after a function response turn.",
    ],
    ["generic role ordering mismatch", "400 Incorrect role information"],
    [
      "alternating role ordering mismatch",
      "messages: roles must alternate between user and assistant",
    ],
  ])("classifies %s as provider conversation-state errors", (_label, message) => {
    expect(classifyProviderRequestError(new Error(message))).toEqual({
      code: "provider_conversation_state_error",
      userMessage: PROVIDER_CONVERSATION_STATE_ERROR_USER_MESSAGE,
      technicalMessage: message,
    });
  });

  it("ignores unrelated provider errors", () => {
    expect(classifyProviderRequestError(new Error("429: rate limit exceeded"))).toBeUndefined();
  });

  it("classifies LiteLLM Vertex beta invalid-argument rejections", () => {
    const message =
      'litellm.BadRequestError: Vertex_ai_betaException BadRequestError - b\'{"error":{"code":400,"message":"Request contains an invalid argument.","status":"INVALID_ARGUMENT"}}\'';

    expect(classifyProviderRequestError(new Error(message))).toEqual({
      code: "provider_invalid_argument",
      userMessage: PROVIDER_INVALID_ARGUMENT_USER_MESSAGE,
      technicalMessage: message,
    });
  });

  it("does not treat generic INVALID_ARGUMENT text as a provider request-shape recovery", () => {
    expect(
      classifyProviderRequestError(new Error("INVALID_ARGUMENT: some other failure")),
    ).toBeUndefined();
  });
});
