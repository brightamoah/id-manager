import type { NitroErrorHandler } from "nitropack";

export default <NitroErrorHandler> function (error, event) {
  // Extract Cloudflare context if available
  const cfContext = event.context.cloudflare;

  // The Ray ID can be found in the CF context or headers
  const rayId = cfContext?.req?.headers?.get("cf-ray") || getHeader(event, "cf-ray") || "unknown";

  const isDev = import.meta.dev;
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage || "Internal Server Error";

  // Construct an understandable error response
  const response = {
    error: true,
    statusCode,
    statusMessage,
    message: error.message || "An unexpected error occurred",
    // Only include stack trace in development
    ...(isDev && { stack: error.stack }),
    // Include Cloudflare Ray ID for debugging in production
    cfRayId: rayId,
  };

  setResponseStatus(event, statusCode, statusMessage);
  setResponseHeader(event, "Content-Type", "application/json");

  return send(event, JSON.stringify(response));
};
