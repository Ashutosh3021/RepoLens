/**
 * LLM Provider Service
 * Handles multiple AI providers: Gemini, OpenAI, Anthropic, Groq, Ollama
 * Routes calls to appropriate SDK based on user preference.
 *
 * Ollama uses the OpenAI SDK pointed at a local base URL — no extra packages needed.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import type { AIProvider, LLMResponse } from "../lib/types";

/**
 * Default models for each provider
 */
const DEFAULT_MODELS: Record<AIProvider, string> = {
  gemini: "gemini-1.5-flash",
  openai: "gpt-4o-mini",
  anthropic: "claude-3-haiku-20240307",
  groq: "llama-3.1-8b-instant",
  ollama: process.env.OLLAMA_MODEL || "llama3.2",
};

/**
 * Provider configuration.
 * For Ollama, `apiKey` holds the base URL (e.g. http://localhost:11434).
 */
interface ProviderConfig {
  apiKey: string;
  model?: string;
}

/**
 * Initialize Gemini client
 */
function initGemini(config: ProviderConfig) {
  return new GoogleGenerativeAI(config.apiKey);
}

/**
 * Initialize OpenAI client
 */
function initOpenAI(config: ProviderConfig) {
  return new OpenAI({ apiKey: config.apiKey });
}

/**
 * Initialize Anthropic client
 */
function initAnthropic(config: ProviderConfig) {
  return new Anthropic({ apiKey: config.apiKey });
}

/**
 * Initialize Groq client
 */
function initGroq(config: ProviderConfig) {
  return new Groq({ apiKey: config.apiKey });
}

/**
 * Initialize Ollama client via the OpenAI SDK with a custom baseURL.
 * config.apiKey holds the Ollama base URL (e.g. http://localhost:11434).
 */
function initOllama(config: ProviderConfig) {
  return new OpenAI({
    baseURL: `${config.apiKey}/v1`,
    apiKey: "ollama", // Ollama doesn't require a real key
  });
}

/**
 * LLM Service class
 */
export class LLMService {
  private clients: Map<AIProvider, unknown> = new Map();
  private configs: Map<AIProvider, ProviderConfig> = new Map();

  /**
   * Register a provider with its configuration.
   * For Ollama, pass the base URL in the `apiKey` field.
   */
  registerProvider(provider: AIProvider, config: ProviderConfig): void {
    this.configs.set(provider, config);

    switch (provider) {
      case "gemini":
        this.clients.set(provider, initGemini(config));
        break;
      case "openai":
        this.clients.set(provider, initOpenAI(config));
        break;
      case "anthropic":
        this.clients.set(provider, initAnthropic(config));
        break;
      case "groq":
        this.clients.set(provider, initGroq(config));
        break;
      case "ollama":
        this.clients.set(provider, initOllama(config));
        break;
    }
  }

  /**
   * Check if provider is registered
   */
  isRegistered(provider: AIProvider): boolean {
    return this.clients.has(provider);
  }

  /**
   * Generate completion using specified provider
   */
  async generateCompletion(
    provider: AIProvider,
    prompt: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<LLMResponse> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`Provider ${provider} not registered`);
    }

    const model = options.model || config.model || DEFAULT_MODELS[provider];
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 4096;

    try {
      switch (provider) {
        case "gemini":
          return this.callGemini(prompt, model, temperature, maxTokens, options.systemPrompt);
        case "openai":
          return this.callOpenAI(prompt, model, temperature, maxTokens, options.systemPrompt, "openai");
        case "anthropic":
          return this.callAnthropic(prompt, model, temperature, maxTokens, options.systemPrompt);
        case "groq":
          return this.callGroq(prompt, model, temperature, maxTokens, options.systemPrompt);
        case "ollama":
          return this.callOpenAI(prompt, model, temperature, maxTokens, options.systemPrompt, "ollama");
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error calling ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Call Gemini API
   */
  private async callGemini(
    prompt: string,
    model: string,
    temperature: number,
    maxTokens: number,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    const client = this.clients.get("gemini") as GoogleGenerativeAI;
    const modelInstance = client.getGenerativeModel({ model });

    const generationConfig = {
      temperature,
      maxOutputTokens: maxTokens,
    };

    let result;
    if (systemPrompt) {
      const chat = modelInstance.startChat({
        generationConfig,
        history: [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
          {
            role: "model",
            parts: [{ text: "I understand. I'll help you with that." }],
          },
        ],
      });
      result = await chat.sendMessage(prompt);
    } else {
      result = await modelInstance.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });
    }

    const response = result.response;
    return {
      content: response.text(),
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      model,
      provider: "gemini",
    };
  }

  /**
   * Call OpenAI-compatible API.
   * Used for both OpenAI and Ollama (which exposes an OpenAI-compatible endpoint).
   * @param clientKey - which client to look up: "openai" or "ollama"
   */
  private async callOpenAI(
    prompt: string,
    model: string,
    temperature: number,
    maxTokens: number,
    systemPrompt?: string,
    clientKey: "openai" | "ollama" = "openai"
  ): Promise<LLMResponse> {
    const client = this.clients.get(clientKey) as OpenAI;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    return {
      content: response.choices[0].message.content || "",
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      model,
      provider: clientKey,
    };
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(
    prompt: string,
    model: string,
    temperature: number,
    maxTokens: number,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    const client = this.clients.get("anthropic") as Anthropic;

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content
      .map((block) => ("text" in block ? block.text : ""))
      .join("");

    return {
      content,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      model,
      provider: "anthropic",
    };
  }

  /**
   * Call Groq API
   */
  private async callGroq(
    prompt: string,
    model: string,
    temperature: number,
    maxTokens: number,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    const client = this.clients.get("groq") as Groq;

    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    return {
      content: response.choices[0].message.content || "",
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      model,
      provider: "groq",
    };
  }

  /**
   * Validate an API key / connection for a provider.
   *
   * For Ollama, `apiKey` is the base URL. We do a lightweight GET to
   * /api/tags instead of a full completion to avoid slow model loads.
   */
  async validateApiKey(provider: AIProvider, apiKey: string): Promise<boolean> {
    if (provider === "ollama") {
      try {
        const res = await fetch(`${apiKey}/api/tags`);
        return res.ok;
      } catch {
        return false;
      }
    }

    try {
      const testService = new LLMService();
      testService.registerProvider(provider, { apiKey });

      await testService.generateCompletion(provider, "Say 'OK' if you can hear me.", {
        maxTokens: 10,
      });

      return true;
    } catch (error) {
      console.error(`API key validation failed for ${provider}:`, error);
      return false;
    }
  }
}

/**
 * Global LLM service singleton
 */
export const llmService = new LLMService();

// ---------------------------------------------------------------------------
// Auto-register providers from environment variables at module load time
// ---------------------------------------------------------------------------

if (process.env.GEMINI_API_KEY) {
  llmService.registerProvider("gemini", {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || DEFAULT_MODELS.gemini,
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("✅ Gemini provider initialized");
  }
}

if (process.env.OPENAI_API_KEY) {
  llmService.registerProvider("openai", {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || DEFAULT_MODELS.openai,
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("✅ OpenAI provider initialized");
  }
}

if (process.env.ANTHROPIC_API_KEY) {
  llmService.registerProvider("anthropic", {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || DEFAULT_MODELS.anthropic,
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("✅ Anthropic provider initialized");
  }
}

if (process.env.GROQ_API_KEY) {
  llmService.registerProvider("groq", {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || DEFAULT_MODELS.groq,
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("✅ Groq provider initialized");
  }
}

if (process.env.OLLAMA_BASE_URL) {
  llmService.registerProvider("ollama", {
    // apiKey field repurposed to hold the Ollama base URL
    apiKey: process.env.OLLAMA_BASE_URL,
    model: process.env.OLLAMA_MODEL || DEFAULT_MODELS.ollama,
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("✅ Ollama provider initialized at", process.env.OLLAMA_BASE_URL);
  }
}
