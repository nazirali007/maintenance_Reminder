import "server-only";

/**
 * Wraps a route handler so an uncaught exception returns a proper JSON 500
 * instead of the empty body Next.js sends by default in production for an
 * unhandled Route Handler error — which client code can't safely res.json()
 * (throws "Unexpected end of JSON input"). Catches anything that slips past
 * the handler's own error handling: a DB blip, an unexpected constraint
 * violation, whatever.
 */
export async function withApiErrorHandling(
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    return await handler();
  } catch (err) {
    console.error("Unhandled API error:", err);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
