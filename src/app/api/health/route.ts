import { NextResponse } from "next/server";

/**
 * Health check endpoint for Render deployment monitoring
 * Returns 200 OK when the service is running
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "beprepared-nextjs",
    },
    { status: 200 }
  );
}
