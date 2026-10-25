import { useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { ColumnDef } from '@tanstack/react-table';
import AdminLayout from '@/Layouts/AdminLayout';
import { AdminPageHeader } from '@/components/Admin/AdminPageHeader';
import { useAdminLoading } from '@/hooks/useAdminLoading';
import { TableSkeleton, type TableColumnConfig } from '@/components/Admin/skeletons';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    TableActionMenu,
    TableActionMenuTrigger,
    TableActionMenuContent,
    TableActionMenuItem,
    TableActionMenuLabel,
    TableActionMenuSeparator,
} from '@/components/ui/table-action-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Trash2,
    Pencil,
    Zap,
    RefreshCw,
    Eye,
    EyeOff,
    RotateCcw,
} from 'lucide-react';
import { User } from '@/types';
import { AiProvider, AiProviderType } from '@/types/admin';
import { toast } from 'sonner';
import { useTranslation } from '@/contexts/LanguageContext';

interface ModelPricing {
    input: number;
    output: number;
}

interface AiProvidersProps {
    user: User;
    providers: AiProvider[];
    providerTypes: Record<string, string>;
    defaultModels: Record<string, string[]>;
    defaultBaseUrls?: Record<string, string>;
    modelPricing: Record<string, Record<string, ModelPricing>>;
    tokensPerProject: number;
}

interface ProviderFormData {
    name: string;
    type: AiProviderType;
    api_key: string;
    base_url: string;
    default_model: string;
    available_models_text: string;
    max_tokens: number;
    summarizer_max_tokens: number;
}

interface ProviderFormProps {
    formData: ProviderFormData;
    setFormData: (data: ProviderFormData) => void;
    providerTypes: Record<string, string>;
    defaultModels: Record<string, string[]>;
    defaultBaseUrls?: Record<string, string>;
    showApiKey: boolean;
    setShowApiKey: (show: boolean) => void;
    isEdit?: boolean;
    errors?: Record<string, string>;
}

function ProviderForm({
    formData,
    setFormData,
    providerTypes,
    defaultModels,
    defaultBaseUrls = {},
    showApiKey,
    setShowApiKey,
    isEdit = false,
    errors = {},
}: ProviderFormProps) {
    const { t } = useTranslation();

    const handleTypeChange = (newType: AiProviderType) => {
        const defaultUrl = defaultBaseUrls[newType] || '';
        const suggestedModel = defaultModels[newType]?.[0] || '';
        const suggestedModelsList = (defaultModels[newType] || []).join(', ');

        setFormData({
            ...formData,
            type: newType,
            base_url: defaultUrl,
            default_model: suggestedModel,
            available_models_text: suggestedModelsList,
        });
    };

    const suggestedModels = defaultModels[formData.type] || [];

    return (
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-2">
                <Label htmlFor="name">{t('Name')}</Label>
                <Input
                    id="name"
                    placeholder={t('e.g. OpenRouter, Local Ollama, Custom LLM')}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                    <p className="text-sm text-destructive">{t(errors.name)}</p>
                )}
            </div>

            {!isEdit ? (
                <div className="space-y-2">
                    <Label htmlFor="type">{t('Provider Type / Protocol')}</Label>
                    <Select
                        value={formData.type}
                        onValueChange={handleTypeChange}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(providerTypes).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ) : (
                <div className="space-y-2">
                    <Label>{t('Provider Type')}</Label>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-sm py-1 px-2.5">
                            {providerTypes[formData.type] || formData.type}
                        </Badge>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="base_url">{t('API Base URL')}</Label>
                    {defaultBaseUrls[formData.type] && formData.base_url !== defaultBaseUrls[formData.type] && (
                        <button
                            type="button"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                            onClick={() => setFormData({ ...formData, base_url: defaultBaseUrls[formData.type] })}
                        >
                            <RotateCcw className="h-3 w-3" />
                            {t('Reset to default')}
                        </button>
                    )}
                </div>
                <Input
                    id="base_url"
                    placeholder={defaultBaseUrls[formData.type] || 'https://api.openai.com/v1'}
                    value={formData.base_url}
                    onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                    className={errors.base_url ? 'border-destructive font-mono text-sm' : 'font-mono text-sm'}
                />
                <p className="text-xs text-muted-foreground">
                    {t('API endpoint (e.g. https://openrouter.ai/api/v1, http://localhost:11434/v1, or any OpenAI-compatible base URL)')}
                </p>
                {errors.base_url && (
                    <p className="text-sm text-destructive">{t(errors.base_url)}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="api_key">
                    {t('API Key')} {isEdit && <span className="text-muted-foreground">({t('leave empty to keep existing')})</span>}
                </Label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            id="api_key"
                            type={showApiKey ? 'text' : 'password'}
                            placeholder={isEdit ? '••••••••••••••••' : t('Enter API key (or leave empty for local Ollama)')}
                            value={formData.api_key}
                            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                            className={errors.api_key ? 'border-destructive font-mono' : 'font-mono'}
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowApiKey(!showApiKey)}
                    >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                {errors.api_key && (
                    <p className="text-sm text-destructive">{t(errors.api_key)}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="default_model">{t('Default Model ID')}</Label>
                <div className="relative">
                    <Input
                        id="default_model"
                        placeholder="e.g. gpt-4o, anthropic/claude-3.5-sonnet, deepseek-chat, llama3.3"
                        value={formData.default_model}
                        onChange={(e) => setFormData({ ...formData, default_model: e.target.value })}
                        list="preset-models-list"
                        className={errors.default_model ? 'border-destructive font-mono text-sm' : 'font-mono text-sm'}
                    />
                    <datalist id="preset-models-list">
                        {suggestedModels.map((model) => (
                            <option key={model} value={model} />
                        ))}
                    </datalist>
                </div>
                {suggestedModels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-[11px] text-muted-foreground mr-1 self-center">{t('Presets:')}</span>
                        {suggestedModels.slice(0, 6).map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setFormData({ ...formData, default_model: m })}
                                className={`text-[11px] px-1.5 py-0.5 rounded border transition-colors ${
                                    formData.default_model === m
                                        ? 'bg-primary text-primary-foreground border-primary font-medium'
                                        : 'bg-muted/60 hover:bg-muted text-muted-foreground'
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                )}
                {errors.default_model && (
                    <p className="text-sm text-destructive">{t(errors.default_model)}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="available_models_text">{t('Available Models (Optional, Comma-Separated)')}</Label>
                <Input
                    id="available_models_text"
                    placeholder="model-id-1, model-id-2, model-id-3..."
                    value={formData.available_models_text}
                    onChange={(e) => setFormData({ ...formData, available_models_text: e.target.value })}
                    className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                    {t('List of models provided by this endpoint that can be selected in plans.')}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="max_tokens">{t('Max Tokens')}</Label>
                    <Input
                        id="max_tokens"
                        type="number"
                        placeholder="8192"
                        value={formData.max_tokens}
                        onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) || 8192 })}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="summarizer_max_tokens">{t('Summarizer Tokens')}</Label>
                    <Input
                        id="summarizer_max_tokens"
                        type="number"
                        placeholder="500"
                        value={formData.summarizer_max_tokens}
                        onChange={(e) => setFormData({ ...formData, summarizer_max_tokens: parseInt(e.target.value) || 500 })}
                    />
                </div>
            </div>
        </div>
    );
}

// Cost Estimator Component
function CostEstimator({
    type,
    model,
    modelPricing,
    tokensPerProject,
}: {
    type: AiProviderType;
    model: string;
    modelPricing: Record<string, Record<string, ModelPricing>>;
    tokensPerProject: number;
}) {
    const { t } = useTranslation();
    const pricing = modelPricing[type]?.[model] || { input: 0, output: 0 };
    const projectCounts = [100, 500, 1000];

    // Assume 60% input, 40% output tokens
    const inputRatio = 0.6;
    const outputRatio = 0.4;

    const calculateCost = (projectCount: number) => {
        const totalTokens = tokensPerProject * projectCount;
        const inputTokens = totalTokens * inputRatio;
        const outputTokens = totalTokens * outputRatio;
        const inputCost = (inputTokens / 1_000_000) * pricing.input;
        const outputCost = (outputTokens / 1_000_000) * pricing.output;
        return (inputCost + outputCost).toFixed(2);
    };

    const formatTokens = (count: number) => {
        const total = tokensPerProject * count;
        if (total >= 1_000_000_000) return `${(total / 1_000_000_000).toFixed(1)}B`;
        if (total >= 1_000_000) return `${(total / 1_000_000).toFixed(0)}M`;
        return `${(total / 1000).toFixed(0)}K`;
    };

    if (type === 'zhipu') {
        return (
            <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2">{t('Cost Estimator')}</h4>
                <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">{t('Subscription-based')}</span> — {t('This provider uses a z.ai subscription. No per-token costs apply.')}
                </p>
            </div>
        );
    }

    if (pricing.input === 0 && pricing.output === 0) {
        return (
            <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2">{t('Cost Estimator')}</h4>
                <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">{t('Custom / Direct API')}</span> — {t('Billed directly by your configured AI provider endpoint.')}
                </p>
            </div>
        );
    }

    return (
        <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium mb-2">{t('Cost Estimator')}</h4>
            <p className="text-xs text-muted-foreground mb-3">
                {t('Typical usage:')} ~{tokensPerProject >= 1_000_000 ? `${(tokensPerProject / 1_000_000).toFixed(1)}M` : `${(tokensPerProject / 1_000).toFixed(0)}K`} {t('tokens per project')}
            </p>
            <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-2 font-medium text-muted-foreground border-b pb-1">
                    <span>{t('Projects/mo')}</span>
                    <span>{t('Tokens')}</span>
                    <span>{t('Est. Cost')}</span>
                </div>
                {projectCounts.map((count) => (
                    <div key={count} className="grid grid-cols-3 gap-2">
                        <span>{count.toLocaleString()}</span>
                        <span>{formatTokens(count)}</span>
                        <span className="font-medium">${calculateCost(count)}</span>
                    </div>
                ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
                {t('Pricing:')} ${pricing.input}/{t('MTok input')}, ${pricing.output}/{t('MTok output')}
            </p>
        </div>
    );
}

// Skeleton column configuration for AI Providers table
const skeletonColumns: TableColumnConfig[] = [
    { type: 'text', width: 'w-32' },          // Name
    { type: 'badge', width: 'w-20' },         // Type
    { type: 'status', width: 'w-24' },        // Status
    { type: 'badge', width: 'w-16' },         // Default
    { type: 'text', width: 'w-24' },          // Models
    { type: 'text', width: 'w-24' },          // Created
    { type: 'actions', width: 'w-12' },       // Actions
];

export default function AiProviders({
    user,
    providers,
    providerTypes,
    defaultModels,
    defaultBaseUrls = {},
    modelPricing,
    tokensPerProject,
}: AiProvidersProps) {
    const { t } = useTranslation();
    const { isLoading } = useAdminLoading();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<AiProvider | null>(null);
    const [providerToDelete, setProviderToDelete] = useState<AiProvider | null>(null);
    const [isTestingConnection, setIsTestingConnection] = useState<number | null>(null);
    const [showApiKey, setShowApiKey] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<ProviderFormData>({
        name: '',
        type: 'openai' as AiProviderType,
        api_key: '',
        base_url: defaultBaseUrls['openai'] || 'https://api.openai.com/v1',
        default_model: defaultModels['openai']?.[0] || 'gpt-4o',
        available_models_text: (defaultModels['openai'] || []).join(', '),
        max_tokens: 8192,
        summarizer_max_tokens: 500,
    });

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'openai',
            api_key: '',
            base_url: defaultBaseUrls['openai'] || 'https://api.openai.com/v1',
            default_model: defaultModels['openai']?.[0] || 'gpt-4o',
            available_models_text: (defaultModels['openai'] || []).join(', '),
            max_tokens: 8192,
            summarizer_max_tokens: 500,
        });
        setShowApiKey(false);
        setFormErrors({});
    };

    const validateForm = (isEdit: boolean) => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) {
            errors.name = t('Name is required');
        }
        if (!isEdit && !formData.api_key.trim() && formData.type !== 'ollama') {
            errors.api_key = t('API key is required');
        }
        if (!formData.default_model.trim()) {
            errors.default_model = t('Default model is required');
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAdd = () => {
        if (!validateForm(false)) {
            return;
        }

        const payload = {
            ...formData,
            available_models: formData.available_models_text
                ? formData.available_models_text.split(',').map((s) => s.trim()).filter(Boolean)
                : undefined,
        };

        router.post(route('admin.ai-providers.store'), payload, {
            onSuccess: () => {
                setIsAddDialogOpen(false);
                resetForm();
                toast.success(t('AI provider added successfully'));
            },
            onError: (errors) => {
                setFormErrors(errors as Record<string, string>);
                toast.error(Object.values(errors)[0] as string);
            },
        });
    };

    const handleEdit = () => {
        if (!selectedProvider) return;
        if (!validateForm(true)) {
            return;
        }

        const payload = {
            ...formData,
            available_models: formData.available_models_text
                ? formData.available_models_text.split(',').map((s) => s.trim()).filter(Boolean)
                : undefined,
        };

        router.put(route('admin.ai-providers.update', selectedProvider.id), payload, {
            onSuccess: () => {
                setIsEditDialogOpen(false);
                setSelectedProvider(null);
                resetForm();
                toast.success(t('AI provider updated successfully'));
            },
            onError: (errors) => {
                setFormErrors(errors as Record<string, string>);
                toast.error(Object.values(errors)[0] as string);
            },
        });
    };

    const handleDelete = (provider: AiProvider) => {
        if (provider.plans_count && provider.plans_count > 0) {
            toast.error(t('Cannot delete: Provider is assigned to {{count}} plan(s)', { count: provider.plans_count }));
            return;
        }
        setProviderToDelete(provider);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!providerToDelete) return;
        router.delete(route('admin.ai-providers.destroy', providerToDelete.id), {
            onSuccess: () => {
                toast.success(t('AI provider deleted'));
                setIsDeleteDialogOpen(false);
                setProviderToDelete(null);
            },
            onError: (errors) => toast.error(Object.values(errors)[0] as string),
        });
    };

    const handleToggleStatus = (provider: AiProvider) => {
        router.put(route('admin.ai-providers.update', provider.id), {
            status: provider.status === 'active' ? 'inactive' : 'active',
        }, {
            preserveScroll: true,
            onSuccess: () => toast.success(t('Status updated')),
        });
    };

    const handleTestConnection = async (provider: AiProvider) => {
        setIsTestingConnection(provider.id);
        try {
            const response = await axios.post(route('admin.ai-providers.test', provider.id));
            toast.success(response.data.message || t('Connection successful'));
        } catch (error) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
            toast.error(message || t('Connection failed'));
        } finally {
            setIsTestingConnection(null);
        }
    };

    const openEditDialog = (provider: AiProvider) => {
        setSelectedProvider(provider);
        const configuredBaseUrl = provider.config?.base_url || defaultBaseUrls[provider.type] || '';
        const defaultModel = provider.config?.default_model || provider.available_models?.[0] || '';
        const modelsList = (provider.available_models || []).join(', ');

        setFormData({
            name: provider.name,
            type: provider.type,
            api_key: '', // Don't expose existing key
            base_url: configuredBaseUrl,
            default_model: defaultModel,
            available_models_text: modelsList,
            max_tokens: provider.config?.max_tokens || 8192,
            summarizer_max_tokens: provider.config?.summarizer_max_tokens || 500,
        });
        setShowApiKey(false);
        setIsEditDialogOpen(true);
    };

    const columns: ColumnDef<AiProvider>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t('Name')} />
            ),
            cell: ({ row }) => {
                const provider = row.original;
                return (
                    <div>
                        <span className="font-medium">{provider.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {provider.type_label}
                            </Badge>
                            {provider.config?.base_url && (
                                <span
                                    className="text-[11px] text-muted-foreground font-mono truncate max-w-[220px]"
                                    title={provider.config.base_url}
                                >
                                    {provider.config.base_url}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t('Status')} />
            ),
            cell: ({ row }) => {
                const provider = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={provider.status === 'active'}
                            onCheckedChange={() => handleToggleStatus(provider)}
                        />
                        <Badge variant={provider.status === 'active' ? 'default' : 'secondary'}>
                            {provider.status === 'active' ? t('active') : t('inactive')}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: 'config.default_model',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t('Model')} />
            ),
            cell: ({ row }) => {
                const provider = row.original;
                const model = provider.config?.default_model || provider.available_models?.[0] || '-';
                const totalModels = provider.available_models?.length || 0;
                return (
                    <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm">{model}</span>
                        {totalModels > 1 && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                +{totalModels - 1}
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'config.max_tokens',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t('Max Tokens')} />
            ),
            cell: ({ row }) => {
                const maxTokens = row.original.config?.max_tokens;
                return maxTokens ? maxTokens.toLocaleString() : '-';
            },
        },
        {
            accessorKey: 'plans_count',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t('Plans')} />
            ),
            cell: ({ row }) => row.original.plans_count || 0,
        },
        {
            id: 'actions',
            enableHiding: false,
            cell: ({ row }) => {
                const provider = row.original;
                return (
                    <TableActionMenu>
                        <TableActionMenuTrigger />
                        <TableActionMenuContent>
                            <TableActionMenuLabel>{t('Actions')}</TableActionMenuLabel>
                            <TableActionMenuItem
                                onClick={() => handleTestConnection(provider)}
                                disabled={isTestingConnection === provider.id || (!provider.has_credentials && provider.type !== 'ollama')}
                            >
                                {isTestingConnection === provider.id ? (
                                    <RefreshCw className="me-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Zap className="me-2 h-4 w-4" />
                                )}
                                {t('Test Connection')}
                            </TableActionMenuItem>
                            <TableActionMenuItem onClick={() => openEditDialog(provider)}>
                                <Pencil className="me-2 h-4 w-4" />
                                {t('Edit')}
                            </TableActionMenuItem>
                            <TableActionMenuSeparator />
                            <TableActionMenuItem
                                variant="destructive"
                                onClick={() => handleDelete(provider)}
                            >
                                <Trash2 className="me-2 h-4 w-4" />
                                {t('Delete')}
                            </TableActionMenuItem>
                        </TableActionMenuContent>
                    </TableActionMenu>
                );
            },
        },
    ];

    return (
        <AdminLayout user={user} title={t('AI Providers')}>
            <AdminPageHeader
                title={t('AI Providers')}
                subtitle={t('Configure custom & standard AI models, base URLs, and API keys')}
                action={
                    <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                        setIsAddDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 me-2" />
                                {t('Add Provider')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>{t('Add AI Model Provider')}</DialogTitle>
                                <DialogDescription>
                                    {t('Add any AI model provider by configuring its API key, base URL, and model ID.')}
                                </DialogDescription>
                            </DialogHeader>
                            <ProviderForm
                                formData={formData}
                                setFormData={setFormData}
                                providerTypes={providerTypes}
                                defaultModels={defaultModels}
                                defaultBaseUrls={defaultBaseUrls}
                                showApiKey={showApiKey}
                                setShowApiKey={setShowApiKey}
                                errors={formErrors}
                            />
                            {formData.default_model && (
                                <CostEstimator
                                    type={formData.type}
                                    model={formData.default_model}
                                    modelPricing={modelPricing}
                                    tokensPerProject={tokensPerProject}
                                />
                            )}
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    {t('Cancel')}
                                </Button>
                                <Button onClick={handleAdd}>{t('Add Provider')}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                }
            />

            {isLoading ? (
                <TableSkeleton
                    columns={skeletonColumns}
                    rows={5}
                    showSearch
                />
            ) : (
                <DataTable
                    columns={columns}
                    data={providers}
                    searchKey="name"
                    searchPlaceholder={t('Search providers...')}
                />
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                setIsEditDialogOpen(open);
                if (!open) {
                    setSelectedProvider(null);
                    resetForm();
                }
            }}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{t('Edit AI Model Provider')}</DialogTitle>
                        <DialogDescription>
                            {t('Update provider API key, base URL, model, and token settings.')}
                        </DialogDescription>
                    </DialogHeader>
                    <ProviderForm
                        formData={formData}
                        setFormData={setFormData}
                        providerTypes={providerTypes}
                        defaultModels={defaultModels}
                        defaultBaseUrls={defaultBaseUrls}
                        showApiKey={showApiKey}
                        setShowApiKey={setShowApiKey}
                        isEdit
                        errors={formErrors}
                    />
                    {formData.default_model && (
                        <CostEstimator
                            type={formData.type}
                            model={formData.default_model}
                            modelPricing={modelPricing}
                            tokensPerProject={tokensPerProject}
                        />
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            {t('Cancel')}
                        </Button>
                        <Button onClick={handleEdit}>{t('Save Changes')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
                setIsDeleteDialogOpen(open);
                if (!open) setProviderToDelete(null);
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('Are you sure you want to delete this AI provider?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('This action cannot be undone. This will permanently delete the AI provider configuration.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className={buttonVariants({ variant: 'destructive' })}
                        >
                            {t('Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}
