/**
 * SQLite database setup and operations
 * Using better-sqlite3 for synchronous, high-performance operations
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join("/tmp", "repolens-data");
const DB_PATH = path.join(DB_DIR, "repolens.db");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

/**
 * Initialize database connection
 */
export const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

/**
 * Initialize database tables
 */
export function initDatabase(): void {
  // Chat messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_id TEXT NOT NULL,
      user_id TEXT,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for chats table
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_repo_id ON chats(repo_id);
    CREATE INDEX IF NOT EXISTS idx_timestamp ON chats(timestamp);
  `);

  // User settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      provider TEXT DEFAULT 'gemini',
      model TEXT,
      api_key_gemini TEXT,
      api_key_openai TEXT,
      api_key_anthropic TEXT,
      api_key_groq TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Analysis cache table (fallback if Redis unavailable)
  db.exec(`
    CREATE TABLE IF NOT EXISTS analysis_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_full_name TEXT UNIQUE NOT NULL,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL
    )
  `);

  // Create index for cache expiration
  db.exec(`CREATE INDEX IF NOT EXISTS idx_expires ON analysis_cache(expires_at);`);

  // Create cleanup trigger for expired cache entries
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS cleanup_expired_cache
    AFTER INSERT ON analysis_cache
    BEGIN
      DELETE FROM analysis_cache WHERE expires_at < datetime('now');
    END
  `);

  console.log("✅ Database initialized successfully");
}

/**
 * Chat message operations
 */
export const chatDb = {
  /**
   * Get chat history for a repository
   * @param repoId - Repository identifier (owner/repo)
   * @param limit - Maximum number of messages to return
   */
  getHistory(repoId: string, limit: number = 20) {
    const stmt = db.prepare(`
      SELECT id, repo_id, role, content, timestamp
      FROM chats
      WHERE repo_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    return stmt.all(repoId, limit).reverse();
  },

  /**
   * Save a chat message
   * @param repoId - Repository identifier
   * @param role - Message role (user/assistant/system)
   * @param content - Message content
   * @param userId - Optional user ID
   */
  saveMessage(repoId: string, role: string, content: string, userId?: string) {
    const stmt = db.prepare(`
      INSERT INTO chats (repo_id, user_id, role, content)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(repoId, userId || null, role, content);
  },

  /**
   * Clear chat history for a repository
   * @param repoId - Repository identifier
   */
  clearHistory(repoId: string) {
    const stmt = db.prepare(`
      DELETE FROM chats WHERE repo_id = ?
    `);
    return stmt.run(repoId);
  },

  /**
   * Get message count for a repository
   * @param repoId - Repository identifier
   */
  getMessageCount(repoId: string) {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM chats WHERE repo_id = ?
    `);
    const result = stmt.get(repoId) as { count: number };
    return result.count;
  },

  /**
   * Get all repositories with chat history for a user
   * @param userId - User identifier
   */
  getUserChats(userId: string) {
    const stmt = db.prepare(`
      SELECT DISTINCT 
        repo_id,
        MAX(timestamp) as last_message_time,
        (SELECT content FROM chats c2 
         WHERE c2.repo_id = c1.repo_id 
         ORDER BY timestamp DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM chats c3 WHERE c3.repo_id = c1.repo_id) as message_count
      FROM chats c1
      WHERE user_id = ?
      GROUP BY repo_id
      ORDER BY last_message_time DESC
    `);
    return stmt.all(userId);
  },
};

/**
 * User settings operations
 */
export const settingsDb = {
  /**
   * Get user settings
   * @param userId - User identifier
   */
  get(userId: string) {
    const stmt = db.prepare(`
      SELECT * FROM user_settings WHERE user_id = ?
    `);
    return stmt.get(userId);
  },

  /**
   * Create or update user settings
   * @param userId - User identifier
   * @param settings - Settings object
   */
  upsert(
    userId: string,
    settings: {
      provider?: string;
      model?: string;
      apiKeyGemini?: string;
      apiKeyOpenai?: string;
      apiKeyAnthropic?: string;
      apiKeyGroq?: string;
    }
  ) {
    const stmt = db.prepare(`
      INSERT INTO user_settings (
        user_id, provider, model, 
        api_key_gemini, api_key_openai, api_key_anthropic, api_key_groq
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        provider = COALESCE(excluded.provider, user_settings.provider),
        model = COALESCE(excluded.model, user_settings.model),
        api_key_gemini = COALESCE(excluded.api_key_gemini, user_settings.api_key_gemini),
        api_key_openai = COALESCE(excluded.api_key_openai, user_settings.api_key_openai),
        api_key_anthropic = COALESCE(excluded.api_key_anthropic, user_settings.api_key_anthropic),
        api_key_groq = COALESCE(excluded.api_key_groq, user_settings.api_key_groq),
        updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(
      userId,
      settings.provider || "gemini",
      settings.model || null,
      settings.apiKeyGemini || null,
      settings.apiKeyOpenai || null,
      settings.apiKeyAnthropic || null,
      settings.apiKeyGroq || null
    );
  },

  /**
   * Delete user settings
   * @param userId - User identifier
   */
  delete(userId: string) {
    const stmt = db.prepare(`
      DELETE FROM user_settings WHERE user_id = ?
    `);
    return stmt.run(userId);
  },
};

/**
 * Cache operations (SQLite fallback)
 */
export const cacheDb = {
  /**
   * Get cached analysis
   * @param repoFullName - Repository full name (owner/repo)
   */
  get(repoFullName: string) {
    const stmt = db.prepare(`
      SELECT data FROM analysis_cache
      WHERE repo_full_name = ? AND expires_at > datetime('now')
    `);
    const result = stmt.get(repoFullName) as { data: string } | undefined;
    return result ? JSON.parse(result.data) : null;
  },

  /**
   * Set cached analysis
   * @param repoFullName - Repository full name
   * @param data - Analysis data
   * @param ttlHours - Time to live in hours
   */
  set(repoFullName: string, data: unknown, ttlHours: number = 24) {
    const stmt = db.prepare(`
      INSERT INTO analysis_cache (repo_full_name, data, expires_at)
      VALUES (?, ?, datetime('now', '+' || ? || ' hours'))
      ON CONFLICT(repo_full_name) DO UPDATE SET
        data = excluded.data,
        created_at = CURRENT_TIMESTAMP,
        expires_at = excluded.expires_at
    `);
    return stmt.run(repoFullName, JSON.stringify(data), ttlHours);
  },

  /**
   * Delete cached analysis
   * @param repoFullName - Repository full name
   */
  delete(repoFullName: string) {
    const stmt = db.prepare(`
      DELETE FROM analysis_cache WHERE repo_full_name = ?
    `);
    return stmt.run(repoFullName);
  },
};

// Initialize database on module load
initDatabase();
