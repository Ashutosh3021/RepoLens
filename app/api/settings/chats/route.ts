/**
 * API Route: GET/DELETE /api/settings/chats
 * Manage chat history
 */

import { NextRequest, NextResponse } from "next/server";
import { chatDb } from "@/lib/db";

export async function GET() {
  try {
    const chats = chatDb.getUserChats("anonymous");
    return NextResponse.json({ success: true, data: chats });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get("repoId");

    if (repoId) {
      // Delete specific repo chat
      chatDb.clearHistory(decodeURIComponent(repoId));
      return NextResponse.json({
        success: true,
        message: `Chat history cleared for ${repoId}`,
      });
    }

    // Clear all — iterate all known chats and delete each
    const chats = chatDb.getUserChats("anonymous") as Array<{ repo_id: string }>;
    for (const chat of chats) {
      chatDb.clearHistory(chat.repo_id);
    }

    return NextResponse.json({
      success: true,
      message: "All chat history cleared",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}