<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ChecksDemoMode;
use App\Models\AiProvider;
use App\Services\AdminStatsService;
use App\Services\InternalAiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AiProviderController extends Controller
{
    use ChecksDemoMode;

    /**
     * Display the AI providers list.
     */
    public function index(Request $request): Response
    {
        $providers = AiProvider::query()
            ->withCount('plans')
            ->orderBy('name')
            ->get()
            ->map(fn (AiProvider $provider) => [
                'id' => $provider->id,
                'name' => $provider->name,
                'type' => $provider->type,
                'type_label' => $provider->type_label,
                'status' => $provider->status,
                'has_credentials' => $provider->has_credentials,
                'available_models' => $provider->available_models ?? AiProvider::DEFAULT_MODELS[$provider->type] ?? [],
                'config' => array_merge([
                    'base_url' => $provider->getBaseUrl(),
                    'default_model' => $provider->getDefaultModel(),
                    'max_tokens' => $provider->getMaxTokens(),
                    'summarizer_max_tokens' => $provider->getSummarizerMaxTokens(),
                ], $provider->config ?? []),
                'plans_count' => $provider->plans_count,
                'total_requests' => $provider->total_requests,
                'last_used_at' => $provider->last_used_at?->toISOString(),
                'created_at' => $provider->created_at->toISOString(),
                'updated_at' => $provider->updated_at->toISOString(),
            ]);

        return Inertia::render('Admin/AiProviders', [
            'user' => $request->user()->only('id', 'name', 'email', 'avatar', 'role'),
            'providers' => $providers,
            'providerTypes' => AiProvider::TYPES,
            'defaultModels' => AiProvider::DEFAULT_MODELS,
            'defaultBaseUrls' => AiProvider::DEFAULT_BASE_URLS,
            'modelPricing' => AiProvider::MODEL_PRICING,
            'tokensPerProject' => AiProvider::TOKENS_PER_PROJECT,
        ]);
    }

    /**
     * Store a new AI provider.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($redirect = $this->denyIfDemo()) {
            return $redirect;
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:50',
            'api_key' => 'nullable|string',
            'base_url' => 'nullable|string|max:1000',
            'default_model' => 'required|string|max:255',
            'max_tokens' => 'nullable|integer|min:1|max:200000',
            'summarizer_max_tokens' => 'nullable|integer|min:100|max:4096',
            'available_models' => 'nullable',
        ]);

        // Process available_models (supports array or comma-separated string)
        $models = [];
        if (! empty($validated['available_models'])) {
            if (is_string($validated['available_models'])) {
                $models = array_values(array_filter(array_map('trim', explode(',', $validated['available_models']))));
            } elseif (is_array($validated['available_models'])) {
                $models = array_values(array_filter(array_map('trim', $validated['available_models'])));
            }
        }

        if (! in_array($validated['default_model'], $models)) {
            array_unshift($models, $validated['default_model']);
        }

        $baseUrl = ! empty($validated['base_url']) ? rtrim($validated['base_url'], '/') : (AiProvider::DEFAULT_BASE_URLS[$validated['type']] ?? null);

        AiProvider::create([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'credentials' => [
                'api_key' => ! empty($validated['api_key']) ? $validated['api_key'] : ($validated['type'] === 'ollama' ? 'ollama' : ''),
            ],
            'config' => array_filter([
                'base_url' => $baseUrl,
                'default_model' => $validated['default_model'],
                'max_tokens' => $validated['max_tokens'] ?? null,
                'summarizer_max_tokens' => $validated['summarizer_max_tokens'] ?? null,
            ]),
            'available_models' => ! empty($models) ? $models : (AiProvider::DEFAULT_MODELS[$validated['type']] ?? [$validated['default_model']]),
            'status' => 'active',
        ]);

        app(AdminStatsService::class)->clearCache();
        InternalAiService::clearAllCache();

        return redirect()->back()->with('success', __('AI provider created successfully'));
    }

    /**
     * Update an AI provider.
     */
    public function update(Request $request, AiProvider $aiProvider): RedirectResponse
    {
        if ($redirect = $this->denyIfDemo()) {
            return $redirect;
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|max:50',
            'api_key' => 'sometimes|nullable|string',
            'base_url' => 'nullable|string|max:1000',
            'default_model' => 'nullable|string|max:255',
            'max_tokens' => 'nullable|integer|min:1|max:200000',
            'summarizer_max_tokens' => 'nullable|integer|min:100|max:4096',
            'available_models' => 'nullable',
            'status' => 'sometimes|in:active,inactive',
        ]);

        // Update name if provided
        if (isset($validated['name'])) {
            $aiProvider->name = $validated['name'];
        }

        // Update type if provided
        if (isset($validated['type'])) {
            $aiProvider->type = $validated['type'];
        }

        // Update status if provided
        if (isset($validated['status'])) {
            $aiProvider->status = $validated['status'];
        }

        // Update credentials only if api_key is provided and not empty
        if (! empty($validated['api_key'])) {
            $aiProvider->credentials = [
                'api_key' => $validated['api_key'],
            ];
        }

        // Update config
        $config = $aiProvider->config ?? [];
        if (array_key_exists('base_url', $validated)) {
            $config['base_url'] = ! empty($validated['base_url']) ? rtrim($validated['base_url'], '/') : null;
        }
        if (array_key_exists('default_model', $validated) && ! empty($validated['default_model'])) {
            $config['default_model'] = $validated['default_model'];
        }
        if (array_key_exists('max_tokens', $validated)) {
            $config['max_tokens'] = $validated['max_tokens'];
        }
        if (array_key_exists('summarizer_max_tokens', $validated)) {
            $config['summarizer_max_tokens'] = $validated['summarizer_max_tokens'];
        }
        $aiProvider->config = array_filter($config);

        // Update available models if provided
        if (isset($validated['available_models'])) {
            $models = [];
            if (is_string($validated['available_models'])) {
                $models = array_values(array_filter(array_map('trim', explode(',', $validated['available_models']))));
            } elseif (is_array($validated['available_models'])) {
                $models = array_values(array_filter(array_map('trim', $validated['available_models'])));
            }

            if (! empty($config['default_model']) && ! in_array($config['default_model'], $models)) {
                array_unshift($models, $config['default_model']);
            }

            if (! empty($models)) {
                $aiProvider->available_models = $models;
            }
        }

        $aiProvider->save();

        app(AdminStatsService::class)->clearCache();
        InternalAiService::clearAllCache();

        return redirect()->back()->with('success', __('AI provider updated successfully'));
    }

    /**
     * Delete an AI provider.
     */
    public function destroy(AiProvider $aiProvider): RedirectResponse
    {
        if ($redirect = $this->denyIfDemo()) {
            return $redirect;
        }

        // Check if provider is assigned to any plans
        $plansCount = $aiProvider->plans()->count();
        if ($plansCount > 0) {
            return redirect()->back()->with('error', __('Cannot delete: This provider is assigned to :count plan(s)', ['count' => $plansCount]));
        }

        $aiProvider->delete();

        app(AdminStatsService::class)->clearCache();
        InternalAiService::clearAllCache();

        return redirect()->back()->with('success', __('AI provider deleted successfully'));
    }

    /**
     * Test connection to the AI provider.
     */
    public function testConnection(AiProvider $aiProvider): JsonResponse
    {
        $result = $aiProvider->testConnection();

        if ($result['success']) {
            return response()->json([
                'message' => $result['message'],
            ]);
        }

        return response()->json([
            'message' => $result['message'],
        ], 422);
    }
}
