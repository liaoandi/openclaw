import { formatErrorMessage } from "../../infra/errors.js";
import { normalizeLowercaseStringOrEmpty } from "../../shared/string-coerce.js";

export type ProviderRequestErrorCode =
  | "provider_conversation_state_error"
  | "provider_invalid_argument";

export type ProviderRequestErrorClassification = {
  code: ProviderRequestErrorCode;
  userMessage: string;
  technicalMessage: string;
};

export const PROVIDER_CONVERSATION_STATE_ERROR_USER_MESSAGE =
  "⚠️ The model provider rejected the conversation state. Please try again, or use /new to start a fresh session.";

export const PROVIDER_INVALID_ARGUMENT_USER_MESSAGE =
  "⚠️ The model provider rejected this request as invalid. Please try again; if it repeats, use /new or switch to a smaller-context fallback model.";

export function classifyProviderRequestError(
  err: unknown,
): ProviderRequestErrorClassification | undefined {
  const technicalMessage = formatErrorMessage(err);
  if (isProviderInvalidArgumentMessage(technicalMessage)) {
    return {
      code: "provider_invalid_argument",
      userMessage: PROVIDER_INVALID_ARGUMENT_USER_MESSAGE,
      technicalMessage,
    };
  }
  if (isProviderConversationStateErrorMessage(technicalMessage)) {
    return {
      code: "provider_conversation_state_error",
      userMessage: PROVIDER_CONVERSATION_STATE_ERROR_USER_MESSAGE,
      technicalMessage,
    };
  }
  return undefined;
}

export function isProviderInvalidArgumentMessage(message: string): boolean {
  const lower = normalizeLowercaseStringOrEmpty(message);
  if (!lower.includes("invalid_argument")) {
    return false;
  }
  const isVertexBeta =
    lower.includes("vertex_ai_betaexception") ||
    lower.includes("vertex ai beta") ||
    lower.includes("vertex beta");
  if (!isVertexBeta) {
    return false;
  }
  return (
    lower.includes("request contains an invalid argument") || lower.includes("badrequesterror")
  );
}

export function isProviderConversationStateErrorMessage(message: string): boolean {
  const lower = normalizeLowercaseStringOrEmpty(message);
  return (
    (lower.includes("custom tool call output is missing") && lower.includes("call id")) ||
    (lower.includes("toolresult") &&
      lower.includes("tooluse") &&
      lower.includes("exceeds the number") &&
      lower.includes("previous turn")) ||
    lower.includes("function call turn comes immediately after") ||
    lower.includes("incorrect role information") ||
    lower.includes("roles must alternate")
  );
}
