/**
 * API Route: GET /api/chat/[repoId]
 * Get chat history for a repository
 *
 * API Route: DELETE /api/chat/[repoId]
 * Clear chat history for a repository
 */

import { NextRequest, NextResponse } from "next/server";
import { clearChatHistory, getChatHistory } from "@/services/chat";

interface RouteParams {
  params: Promise<{
    repoId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { repoId } = await params;
    const decodedRepoId = decodeURIComponent(repoId);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const messages = getChatHistory(decodedRepoId, limit);

    return NextResponse.json({
      success: true,
      data: {
        repoId: decodedRepoId,
        messages,
        count: messages.length,
      },
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { repoId } = await params;
    const decodedRepoId = decodeURIComponent(repoId);

    clearChatHistory(decodedRepoId);

    return NextResponse.json({
      success: true,
      message: "Chat history cleared successfully",
      repoId: decodedRepoId,
    });
  } catch (error) {
    console.error("Error clearing chat history:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
