<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Http;

class AiProvider extends Model
{
    use HasFactory;

    const TYPE_OPENAI = 'openai';

    const TYPE_ANTHROPIC = 'anthropic';

    const TYPE_GROK = 'grok';

    const TYPE_DEEPSEEK = 'deepseek';

    const TYPE_ZHIPU = 'zhipu';

    const TYPE_OPENROUTER = 'openrouter';

    const TYPE_GROQ = 'groq';

    const TYPE_TOGETHER = 'together';

    const TYPE_MISTRAL = 'mistral';

    const TYPE_OLLAMA = 'ollama';

    const TYPE_CUSTOM = 'custom';

    const TYPES = [
        self::TYPE_OPENAI => 'OpenAI',
        self::TYPE_ANTHROPIC => 'Anthropic',
        self::TYPE_GROK => 'Grok (xAI)',
        self::TYPE_DEEPSEEK => 'DeepSeek',
        self::TYPE_OPENROUTER => 'OpenRouter',
        self::TYPE_GROQ => 'Groq Cloud',
        self::TYPE_TOGETHER => 'Together AI',
        self::TYPE_MISTRAL => 'Mistral AI',
        self::TYPE_OLLAMA => 'Ollama (Local)',
        self::TYPE_ZHIPU => 'ZhipuAI',
        self::TYPE_CUSTOM => 'Custom (OpenAI-Compatible)',
    ];

    const DEFAULT_MODELS = [
        self::TYPE_OPENAI => [
            'gpt-5.2', 'gpt-5.1', 'gpt-5-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini',
        ],
        self::TYPE_ANTHROPIC => [
            'claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5', 'claude-3-5-sonnet-20241022',
        ],
        self::TYPE_GROK => [
            'grok-4-1-fast-reasoning',
            'grok-code-fast-1',
            'grok-2-latest',
        ],
        self::TYPE_DEEPSEEK => [
            'deepseek-chat',
            'deepseek-reasoner',
        ],
        self::TYPE_OPENROUTER => [
            'anthropic/claude-3.5-sonnet',
            'deepseek/deepseek-r1',
            'deepseek/deepseek-chat',
            'openai/gpt-4o',
            'meta-llama/llama-3.3-70b-instruct',
            'google/gemini-2.0-flash-exp:free',
        ],
        self::TYPE_GROQ => [
            'llama-3.3-70b-versatile',
            'llama-3.1-8b-instant',
            'mixtral-8x7b-32768',
            'deepseek-r1-distill-llama-70b',
        ],
        self::TYPE_TOGETHER => [
            'meta-llama/Llama-3.3-70B-Instruct-Turbo',
            'deepseek-ai/DeepSeek-V3',
            'deepseek-ai/DeepSeek-R1',
        ],
        self::TYPE_MISTRAL => [
            'mistral-large-latest',
            'mistral-small-latest',
            'codestral-latest',
        ],
        self::TYPE_OLLAMA => [
            'llama3.2',
            'llama3.3',
            'qwen2.5-coder',
            'deepseek-r1',
            'mistral',
        ],
        self::TYPE_ZHIPU => [
            'glm-5',
            'glm-4.7',
            'glm-4.5-air',
        ],
        self::TYPE_CUSTOM => [
            'default',
        ],
    ];

    /**
     * Model pricing per 1M tokens (USD).
     * Format: ['input' => cost, 'output' => cost]
     */
    const MODEL_PRICING = [
        self::TYPE_OPENAI => [
            'gpt-5.2' => ['input' => 1.75, 'output' => 14.00],
            'gpt-5.1' => ['input' => 1.25, 'output' => 10.00],
            'gpt-5-mini' => ['input' => 0.25, 'output' => 2.00],
            'gpt-4.1' => ['input' => 2.00, 'output' => 8.00],
            'gpt-4.1-mini' => ['input' => 0.40, 'output' => 1.60],
            'gpt-4o-mini' => ['input' => 0.15, 'output' => 0.60],
        ],
        self::TYPE_ANTHROPIC => [
            'claude-opus-4-5' => ['input' => 5.00, 'output' => 25.00],
            'claude-sonnet-4-5' => ['input' => 3.00, 'output' => 15.00],
            'claude-haiku-4-5' => ['input' => 1.00, 'output' => 5.00],
        ],
        self::TYPE_GROK => [
            'grok-4-1-fast-reasoning' => ['input' => 0.20, 'output' => 0.50],
            'grok-code-fast-1' => ['input' => 0.20, 'output' => 1.50],
        ],
        self::TYPE_DEEPSEEK => [
            'deepseek-chat' => ['input' => 0.28, 'output' => 0.42],
        ],
        self::TYPE_ZHIPU => [
            'glm-5' => ['input' => 0, 'output' => 0],
            'glm-4.7' => ['input' => 0, 'output' => 0],
            'glm-4.5-air' => ['input' => 0, 'output' => 0],
        ],
    ];

    /**
     * Typical tokens per project build (estimate).
     */
    const TOKENS_PER_PROJECT = 300000;

    const DEFAULT_BASE_URLS = [
        self::TYPE_OPENAI => 'https://api.openai.com/v1',
        self::TYPE_ANTHROPIC => 'https://api.anthropic.com',
        self::TYPE_GROK => 'https://api.x.ai/v1',
        self::TYPE_DEEPSEEK => 'https://api.deepseek.com',
        self::TYPE_OPENROUTER => 'https://openrouter.ai/api/v1',
        self::TYPE_GROQ => 'https://api.groq.com/openai/v1',
        self::TYPE_TOGETHER => 'https://api.together.xyz/v1',
        self::TYPE_MISTRAL => 'https://api.mistral.ai/v1',
        self::TYPE_OLLAMA => 'http://localhost:11434/v1',
        self::TYPE_ZHIPU => 'https://api.z.ai/api/anthropic',
        self::TYPE_CUSTOM => 'https://api.openai.com/v1',
    ];

    protected $fillable = [
        'name',
        'type',
        'credentials',
        'config',
        'available_models',
        'status',
        'is_default',
        'last_used_at',
        'total_requests',
        'model_pricing',
    ];

    protected function casts(): array
    {
        return [
            'credentials' => 'encrypted:array',
            'config' => 'array',
            'available_models' => 'array',
            'model_pricing' => 'array',
            'is_default' => 'boolean',
            'last_used_at' => 'datetime',
        ];
    }

    protected $hidden = ['credentials'];

    /**
     * Scope: Active providers only.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope: Filter by type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Get plans that use this provider as primary.
     */
    public function plans(): HasMany
    {
        return $this->hasMany(Plan::class, 'ai_provider_id');
    }

    /**
     * Get the API key from credentials.
     */
    public function getApiKey(): ?string
    {
        return $this->credentials['api_key'] ?? null;
    }

    /**
     * Get the base URL for API calls.
     */
    public function getBaseUrl(): string
    {
        if (! empty($this->config['base_url'])) {
            return rtrim($this->config['base_url'], '/');
        }

        return self::DEFAULT_BASE_URLS[$this->type]
            ?? self::DEFAULT_BASE_URLS[self::TYPE_CUSTOM]
            ?? 'https://api.openai.com/v1';
    }

    /**
     * Get the default model for this provider.
     */
    public function getDefaultModel(): string
    {
        if (! empty($this->config['default_model'])) {
            return $this->config['default_model'];
        }

        $models = $this->available_models ?? self::DEFAULT_MODELS[$this->type] ?? [];

        return $models[0] ?? match ($this->type) {
            self::TYPE_ANTHROPIC => 'claude-sonnet-4-5',
            self::TYPE_ZHIPU => 'glm-5',
            default => 'gpt-4o',
        };
    }

    /**
     * Get max tokens setting.
     */
    public function getMaxTokens(): int
    {
        return $this->config['max_tokens'] ?? 8192;
    }

    /**
     * Test connection to the AI provider.
     */
    public function testConnection(): array
    {
        $apiKey = $this->getApiKey();

        if (empty($apiKey) && $this->type !== self::TYPE_OLLAMA) {
            return ['success' => false, 'message' => 'No API key configured'];
        }

        try {
            switch ($this->type) {
                case self::TYPE_ANTHROPIC:
                case self::TYPE_ZHIPU:
                    return $this->testAnthropicConnection();

                case self::TYPE_OPENAI:
                case self::TYPE_GROK:
                case self::TYPE_DEEPSEEK:
                case self::TYPE_OPENROUTER:
                case self::TYPE_GROQ:
                case self::TYPE_TOGETHER:
                case self::TYPE_MISTRAL:
                case self::TYPE_OLLAMA:
                case self::TYPE_CUSTOM:
                default:
                    return $this->testOpenAiConnection();
            }
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Test OpenAI API connection.
     */
    protected function testOpenAiConnection(): array
    {
        $apiKey = $this->getApiKey() ?: 'ollama';
        $baseUrl = $this->getBaseUrl();

        // 1. Try GET /models
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$apiKey,
            ])->timeout(10)->get($baseUrl.'/models');

            if ($response->successful()) {
                return ['success' => true, 'message' => 'Connection successful'];
            }
        } catch (\Exception $e) {
            // Proceed to test chat completions below
        }

        // 2. Try POST /chat/completions with minimal payload
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(10)->post($baseUrl.'/chat/completions', [
                'model' => $this->getDefaultModel(),
                'max_tokens' => 1,
                'messages' => [['role' => 'user', 'content' => 'Hi']],
            ]);

            if ($response->successful()) {
                return ['success' => true, 'message' => 'Connection successful'];
            }

            return [
                'success' => false,
                'message' => $response->json('error.message', 'Connection test failed (HTTP '.$response->status().')'),
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Test Anthropic API connection.
     */
    protected function testAnthropicConnection(): array
    {
        $response = Http::withHeaders([
            'x-api-key' => $this->getApiKey(),
            'anthropic-version' => '2023-06-01',
        ])->post($this->getBaseUrl().'/v1/messages', [
            'model' => $this->getDefaultModel(),
            'max_tokens' => 1,
            'messages' => [['role' => 'user', 'content' => 'Hi']],
        ]);

        if ($response->successful()) {
            return ['success' => true, 'message' => 'Connection successful'];
        }

        return [
            'success' => false,
            'message' => $response->json('error.message', 'Connection failed'),
        ];
    }

    /**
     * Test Grok API connection.
     */
    protected function testGrokConnection(): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->getApiKey(),
        ])->post($this->getBaseUrl().'/chat/completions', [
            'model' => $this->getDefaultModel(),
            'max_tokens' => 1,
            'messages' => [['role' => 'user', 'content' => 'Hi']],
        ]);

        if ($response->successful()) {
            return ['success' => true, 'message' => 'Connection successful'];
        }

        return [
            'success' => false,
            'message' => $response->json('error.message', 'Connection failed'),
        ];
    }

    /**
     * Test DeepSeek API connection.
     */
    protected function testDeepSeekConnection(): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->getApiKey(),
        ])->post($this->getBaseUrl().'/chat/completions', [
            'model' => $this->getDefaultModel(),
            'max_tokens' => 1,
            'messages' => [['role' => 'user', 'content' => 'Hi']],
        ]);

        if ($response->successful()) {
            return ['success' => true, 'message' => 'Connection successful'];
        }

        return [
            'success' => false,
            'message' => $response->json('error.message', 'Connection failed'),
        ];
    }

    /**
     * Test ZhipuAI (z.ai) API connection.
     */
    protected function testZhipuConnection(): array
    {
        $response = Http::withHeaders([
            'x-api-key' => $this->getApiKey(),
            'anthropic-version' => '2023-06-01',
        ])->post($this->getBaseUrl().'/v1/messages', [
            'model' => $this->getDefaultModel(),
            'max_tokens' => 1,
            'messages' => [['role' => 'user', 'content' => 'Hi']],
        ]);

        if ($response->successful()) {
            return ['success' => true, 'message' => 'Connection successful'];
        }

        return [
            'success' => false,
            'message' => $response->json('error.message', 'Connection failed'),
        ];
    }

    /**
     * Increment the request counter and update last used timestamp.
     */
    public function recordUsage(): void
    {
        $this->increment('total_requests');
        $this->update(['last_used_at' => now()]);
    }

    /**
     * Convert provider settings to AI config format for BuilderService.
     */
    public function toAiConfig(): array
    {
        return [
            'provider' => $this->type,
            'provider_type' => $this->type,
            'agent' => [
                'api_key' => $this->getApiKey(),
                'base_url' => $this->getBaseUrl(),
                'model' => $this->getDefaultModel(),
                'max_tokens' => $this->getMaxTokens(),
                'provider_type' => $this->type,
            ],
            'summarizer' => [
                'api_key' => $this->getApiKey(),
                'base_url' => $this->getBaseUrl(),
                'model' => $this->getSummarizerModel(),
                'max_tokens' => $this->getSummarizerMaxTokens(),
                'provider_type' => $this->type,
            ],
            'suggestions' => [
                'api_key' => $this->getApiKey(),
                'base_url' => $this->getBaseUrl(),
                'model' => $this->getSuggestionsModel(),
                'provider_type' => $this->type,
            ],
        ];
    }

    /**
     * Get the model to use for summarization.
     * Uses the same model as agent for consistency.
     */
    protected function getSummarizerModel(): string
    {
        return $this->getDefaultModel();
    }

    /**
     * Get max tokens for summarizer.
     * Configurable per provider, defaults to 500 (reasonable for summaries).
     */
    public function getSummarizerMaxTokens(): int
    {
        return $this->config['summarizer_max_tokens'] ?? 1500;
    }

    /**
     * Get the model to use for suggestions.
     * Uses the same model as agent for consistency.
     */
    protected function getSuggestionsModel(): string
    {
        return $this->getDefaultModel();
    }

    /**
     * Get the type label.
     */
    public function getTypeLabelAttribute(): string
    {
        return self::TYPES[$this->type] ?? $this->type;
    }

    /**
     * Check if credentials are configured.
     */
    public function getHasCredentialsAttribute(): bool
    {
        return ! empty($this->credentials['api_key']);
    }

    /**
     * Clear default flag from all other providers.
     */
    public function makeDefault(): void
    {
        static::where('id', '!=', $this->id)->update(['is_default' => false]);
        $this->update(['is_default' => true]);
    }

    // ============================================
    // Pricing Methods
    // ============================================

    /**
     * Get pricing for a specific model.
     * Returns custom pricing if set, otherwise falls back to default.
     */
    public function getModelPricing(?string $model = null): array
    {
        $model = $model ?? $this->getDefaultModel();

        // Check custom pricing first
        if (! empty($this->model_pricing[$model])) {
            return $this->model_pricing[$model];
        }

        // Fall back to default pricing
        return self::MODEL_PRICING[$this->type][$model] ?? ['input' => 0, 'output' => 0];
    }

    /**
     * Calculate cost for given token usage.
     *
     * @param  int  $inputTokens  Number of input/prompt tokens
     * @param  int  $outputTokens  Number of output/completion tokens
     * @param  string|null  $model  Model name (uses default if not specified)
     * @return float Cost in USD
     */
    public function calculateCost(int $inputTokens, int $outputTokens, ?string $model = null): float
    {
        $pricing = $this->getModelPricing($model);

        // Pricing is per 1M tokens
        $inputCost = ($inputTokens / 1_000_000) * ($pricing['input'] ?? 0);
        $outputCost = ($outputTokens / 1_000_000) * ($pricing['output'] ?? 0);

        return round($inputCost + $outputCost, 6);
    }

    /**
     * Estimate monthly cost for a given number of projects.
     *
     * @param  int  $projectCount  Number of projects per month
     * @param  string|null  $model  Model name (uses default if not specified)
     * @return array Cost estimation details
     */
    public function estimateMonthlyCost(int $projectCount, ?string $model = null): array
    {
        $model = $model ?? $this->getDefaultModel();
        $pricing = $this->getModelPricing($model);

        // Estimate tokens per project (roughly 60% input, 40% output)
        $tokensPerProject = self::TOKENS_PER_PROJECT;
        $inputTokensPerProject = (int) ($tokensPerProject * 0.6);
        $outputTokensPerProject = (int) ($tokensPerProject * 0.4);

        $totalInputTokens = $inputTokensPerProject * $projectCount;
        $totalOutputTokens = $outputTokensPerProject * $projectCount;
        $totalTokens = $totalInputTokens + $totalOutputTokens;

        $inputCost = ($totalInputTokens / 1_000_000) * ($pricing['input'] ?? 0);
        $outputCost = ($totalOutputTokens / 1_000_000) * ($pricing['output'] ?? 0);
        $totalCost = $inputCost + $outputCost;

        return [
            'project_count' => $projectCount,
            'model' => $model,
            'tokens_per_project' => $tokensPerProject,
            'total_tokens' => $totalTokens,
            'total_input_tokens' => $totalInputTokens,
            'total_output_tokens' => $totalOutputTokens,
            'input_cost' => round($inputCost, 2),
            'output_cost' => round($outputCost, 2),
            'total_cost' => round($totalCost, 2),
            'pricing' => $pricing,
        ];
    }

    /**
     * Get all model pricing for this provider type.
     */
    public function getAllModelPricing(): array
    {
        $defaultPricing = self::MODEL_PRICING[$this->type] ?? [];
        $customPricing = $this->model_pricing ?? [];

        return array_merge($defaultPricing, $customPricing);
    }

    /**
     * Get cost estimations for common project volumes.
     */
    public function getCostEstimations(?string $model = null): array
    {
        return [
            $this->estimateMonthlyCost(100, $model),
            $this->estimateMonthlyCost(500, $model),
            $this->estimateMonthlyCost(1000, $model),
        ];
    }

    /**
     * Check if a provider type uses subscription-based pricing (no per-token costs).
     */
    public static function isSubscriptionProvider(string $type): bool
    {
        return $type === self::TYPE_ZHIPU;
    }
}
