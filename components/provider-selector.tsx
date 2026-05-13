/**
 * ProviderSelector Component
 * 
 * Dropdown for selecting AI provider:
 * - Gemini, OpenAI, Anthropic, Groq options
 * - Shows provider icon
 * - Model selector for each provider
 * 
 * Props:
 * - value: string - Selected provider
 * - onChange: (provider: string) => void - Change handler
 * - showModelSelector?: boolean - Show model dropdown
 * - className?: string - Additional CSS classes
 */

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type AIProvider = "gemini" | "openai" | "anthropic" | "groq" | "ollama";

interface ProviderSelectorProps {
  value: AIProvider;
  onChange: (provider: AIProvider) => void;
  showModelSelector?: boolean;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  className?: string;
}

const providers = [
  {
    value: "gemini" as AIProvider,
    label: "Google Gemini",
    icon: "🔮",
    // gemini-1.5-flash is the current default — gemini-1.5-pro is deprecated
    models: ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.0-pro"],
  },
  {
    value: "openai" as AIProvider,
    label: "OpenAI",
    icon: "🤖",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  },
  {
    value: "anthropic" as AIProvider,
    label: "Anthropic Claude",
    icon: "🧠",
    models: ["claude-3-5-sonnet-20240620", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
  },
  {
    value: "groq" as AIProvider,
    label: "Groq",
    icon: "⚡",
    models: ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
  },
  {
    value: "ollama" as AIProvider,
    label: "Ollama (Local)",
    icon: "🦙",
    models: ["llama3.2", "llama3.1", "llama3", "mistral", "codellama", "deepseek-r1", "phi3", "gemma2"],
  },
];

export function ProviderSelector({
  value,
  onChange,
  showModelSelector = true,
  selectedModel,
  onModelChange,
  className,
}: ProviderSelectorProps) {
  const currentProvider = providers.find((p) => p.value === value);
  const currentModels = currentProvider?.models || [];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Provider Selector */}
      <div className="space-y-1.5">
        <label className="text-sm text-slate-400">AI Provider</label>
        <Select value={value} onValueChange={(v) => onChange(v as AIProvider)}>
          <SelectTrigger className="bg-white/[0.03] border-white/[0.08] focus:border-[#00e5ff]/50 focus:ring-[#00e5ff]/20">
            <SelectValue placeholder="Select provider">
              {currentProvider && (
                <div className="flex items-center gap-2">
                  <span>{currentProvider.icon}</span>
                  <span>{currentProvider.label}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-[#0f0f19] border-white/[0.08]">
            {providers.map((provider) => (
              <SelectItem
                key={provider.value}
                value={provider.value}
                className="focus:bg-[#00e5ff]/10 focus:text-[#00e5ff]"
              >
                <div className="flex items-center gap-2">
                  <span>{provider.icon}</span>
                  <span>{provider.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model Selector */}
      {showModelSelector && onModelChange && (
        <div className="space-y-1.5">
          <label className="text-sm text-slate-400">Model</label>
          <Select
            value={selectedModel || currentModels[0]}
            onValueChange={onModelChange}
          >
            <SelectTrigger className="bg-white/[0.03] border-white/[0.08] focus:border-[#00e5ff]/50 focus:ring-[#00e5ff]/20">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f19] border-white/[0.08]">
              {currentModels.map((model) => (
                <SelectItem
                  key={model}
                  value={model}
                  className="focus:bg-[#00e5ff]/10 focus:text-[#00e5ff] font-mono text-xs"
                >
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

/**
 * ProviderBadge Component
 * 
 * Small badge showing current provider
 */
interface ProviderBadgeProps {
  provider: AIProvider;
  className?: string;
}

export function ProviderBadge({ provider, className }: ProviderBadgeProps) {
  const providerInfo = providers.find((p) => p.value === provider);

  if (!providerInfo) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        "bg-white/[0.05] border border-white/[0.08]",
        className
      )}
    >
      <span>{providerInfo.icon}</span>
      <span className="text-slate-300">{providerInfo.label}</span>
    </span>
  );
}
