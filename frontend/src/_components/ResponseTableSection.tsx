import React from 'react';
import { Table, Button, Tooltip, Input, Alert } from 'antd';
import { RiLoopLeftFill } from "react-icons/ri";
import { LuSearchCode } from "react-icons/lu";
import { FaPlay } from "react-icons/fa";
import axios from 'axios';
import SQLEditor from './SQLEditor';
import { TfiClose } from "react-icons/tfi";
import { IoCopy } from "react-icons/io5";
import { FiDownload } from "react-icons/fi";
import { ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface ResponseTableSectionProps {
    promptData: {
        prompt: string;
        query: string;
        table: any[];
        execution_time: number;
    };
    regenerateResponseTable: (prompt: string, query: string) => Promise<any>;
    generateQueryPlan: (query: string) => void;
    setPromptData: React.Dispatch<React.SetStateAction<any>>;
    isRegeneratingResponseTable: boolean;
    isGeneratingQueryPlan: boolean;
    regenerationError?: string | null;
}

export default function ResponseTableSection({
    promptData,
    setPromptData,
    regenerateResponseTable,
    isRegeneratingResponseTable,
    isGeneratingQueryPlan,
    generateQueryPlan,
    regenerationError: externalRegenerationError
}: ResponseTableSectionProps) {
    // Extract columns dynamically from table data
    const columns = promptData.table.length > 0
        ? Object.keys(promptData.table[0]).map(key => ({
            title: key,
            dataIndex: key,
            key,
            render: (value: any) => (typeof value === "object" ? JSON.stringify(value) : value),
            ellipsis: true,
        }))
        : [];

    const [inputQuery, setInputQuery] = React.useState(promptData.query);
    const [isRunningQuery, setIsRunningQuery] = React.useState(false);
    const [editablePrompt, setEditablePrompt] = React.useState(promptData.prompt);
    const [isPromptFocused, setIsPromptFocused] = React.useState(false);
    const [queryError, setQueryError] = React.useState<string | null>(null);
    const [regenerationError, setRegenerationError] = React.useState<string | null>(null);
    const [hasUserEditedQuery, setHasUserEditedQuery] = React.useState(false);
    const [hasUserEditedPrompt, setHasUserEditedPrompt] = React.useState(false);

    // Update inputQuery when promptData.query changes (after regeneration), but only if user hasn't edited it
    React.useEffect(() => {
        if (!hasUserEditedQuery) {
            setInputQuery(promptData.query);
        }
    }, [promptData.query, hasUserEditedQuery]);

    // Update editablePrompt when promptData.prompt changes (after regeneration), but only if user hasn't edited it
    React.useEffect(() => {
        if (!hasUserEditedPrompt) {
            setEditablePrompt(promptData.prompt);
        }
    }, [promptData.prompt, hasUserEditedPrompt]);

    // Reset edit flags when promptData changes from external source (new query loaded)
    React.useEffect(() => {
        // This ensures when a completely new promptData is loaded, we reset the edit flags
        setHasUserEditedQuery(false);
        setHasUserEditedPrompt(false);
        setQueryError(null);
        setRegenerationError(null);
    }, [promptData.prompt, promptData.query]); // Dependency on both to detect new data

    const handleQueryChange = (value: string) => {
        setInputQuery(value);
        setHasUserEditedQuery(true);
        // Clear query error when user starts editing
        if (queryError) {
            setQueryError(null);
        }
    }

    const runInputQuery = () => {
        setIsRunningQuery(true);
        setQueryError(null);
        axios.post('/api/generate-input-query-response-table', { query: inputQuery })
            .then((response) => {
                setPromptData({
                    ...promptData,
                    query: inputQuery,
                    table: response.data.table,
                    execution_time: response.data.execution_time
                });
                setIsRunningQuery(false);
                setQueryError(null);
                // Reset the user edit flags since we successfully ran the query
                setHasUserEditedQuery(false);
            })
            .catch((error) => {
                setIsRunningQuery(false);
                const errorMessage = error.response?.data?.detail || error.message || 'Failed to execute query';
                setQueryError(errorMessage);
                console.error('Query execution error:', error);
            })
    }

    const [chartConfig, setChartConfig] = React.useState(null);
    const generateVisualization = async () => {
        axios.post('/api/generate-plot-config', { query: promptData.query, table: promptData.table })
            .then((response) => {
                response.data.data = promptData.table;
                setChartConfig(response.data);
            }
            )
    };

    const copyQueryToClipboard = () => {
        navigator.clipboard.writeText(inputQuery)
            .then(() => {
                // Query copied successfully
            })
            .catch((error) => {
                // Handle error silently or with proper error handling
            }
            );
    };

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditablePrompt(e.target.value);
        setHasUserEditedPrompt(true);
        // Clear regeneration error when user starts editing
        if (regenerationError) {
            setRegenerationError(null);
        }
    };

    const resetToOriginal = () => {
        setInputQuery(promptData.query);
        setEditablePrompt(promptData.prompt);
        setHasUserEditedQuery(false);
        setHasUserEditedPrompt(false);
        setQueryError(null);
        setRegenerationError(null);
    };

    const regenerateWithUpdatedPrompt = async () => {
        setRegenerationError(null);
        try {
            const result = await regenerateResponseTable(editablePrompt, inputQuery);
            // Reset the user edit flags since we successfully regenerated
            setHasUserEditedPrompt(false);
            setHasUserEditedQuery(false);
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to regenerate response table';
            setRegenerationError(errorMessage);
            console.error('Regeneration error:', error);
        }
    };

    const exportToCSV = () => {

        // Get headers from the first row
        const headers = Object.keys(promptData.table[0]);

        // Convert data to CSV format
        const csvContent = [
            headers.join(','), // Header row
            ...promptData.table.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Handle values that contain commas, quotes, or newlines
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `query_results_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="space-y-6">
                {/* Main Query Results Section */}
                <div
                    className="relative bg-white border-2 border-gray-200 rounded-3xl shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                    {/* Header with actions */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl" style={{ backgroundColor: '#FFE5CC' }}>
                                <LuSearchCode className="text-lg" style={{ color: '#FF9129' }} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-0">Query Results</h2>
                                <p className="text-sm text-gray-500">View and manage your query execution</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {(hasUserEditedQuery || hasUserEditedPrompt) && (
                                <Tooltip title="Reset to original values">
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={resetToOriginal}
                                        className="flex-shrink-0 w-10 h-10 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                                    />
                                </Tooltip>
                            )}
                            <Tooltip title="Close current and start new query">
                                <Button
                                    icon={<TfiClose />}
                                    onClick={() => window.location.reload()}
                                    className="flex-shrink-0 w-10 h-10 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                                />
                            </Tooltip>
                            <Tooltip title="Regenerate with current prompt">
                                <Button
                                    loading={isRegeneratingResponseTable}
                                    icon={<RiLoopLeftFill />}
                                    onClick={regenerateWithUpdatedPrompt}
                                    className="flex-shrink-0 w-10 h-10 rounded-xl border-2 transition-all duration-200 hover:shadow-sm"
                                    style={{
                                        backgroundColor: '#FFE5CC',
                                        borderColor: '#FFB366',
                                        color: '#FF9129'
                                    }}
                                />
                            </Tooltip>
                            <Tooltip title="Inspect query plan">
                                <Button
                                    type="primary"
                                    loading={isGeneratingQueryPlan}
                                    icon={<LuSearchCode />}
                                    onClick={() => generateQueryPlan(promptData.query)}
                                    className="flex-shrink-0 h-10 rounded-xl border-0 hover:shadow-xl hover:scale-105 transition-all duration-200"
                                    style={{
                                        background: 'linear-gradient(135deg, #FF9129 0%, #CC5500 100%)',
                                        boxShadow: '0 8px 20px rgba(255, 145, 41, 0.3)'
                                    }}
                                >
                                    Inspect
                                </Button>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Query Details */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#FFE5CC' }}>
                                        <FaPlay className="text-sm" style={{ color: '#FF9129' }} />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-0">Query Details</h3>
                                </div>

                                <Tooltip title="Run with current prompt">
                                    <Button
                                        type="primary"
                                        size="small"
                                        loading={isRegeneratingResponseTable}
                                        onClick={regenerateWithUpdatedPrompt}
                                        icon={<FaPlay />}
                                        className="rounded-xl border-0 hover:scale-105 transition-all duration-200 p-4"
                                        style={{
                                            background: 'linear-gradient(135deg, #FF9129 0%, #CC5500 100%)',
                                            boxShadow: '0 4px 12px rgba(255, 145, 41, 0.3)'
                                        }}
                                    >
                                        Regenerate
                                    </Button>
                                </Tooltip>
                            </div>

                            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200 rounded-2xl p-4 mb-4">
                                <div className="mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Original Prompt:</span>
                                        {hasUserEditedPrompt && (
                                            <span className="px-2 py-1 text-xs rounded-lg" style={{
                                                backgroundColor: '#FFE5CC',
                                                color: '#CC5500'
                                            }}>
                                                Modified
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        className={`
                                            relative border-2 rounded-xl transition-all duration-300
                                            ${isPromptFocused
                                                ? 'shadow-lg scale-[1.01]'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }
                                        `}
                                        style={{
                                            borderColor: isPromptFocused ? '#FF9129' : undefined,
                                            boxShadow: isPromptFocused ? '0 8px 20px rgba(255, 145, 41, 0.15), 0 0 0 3px rgba(255, 145, 41, 0.08)' : undefined
                                        }}
                                    >
                                        <TextArea
                                            value={editablePrompt}
                                            onChange={handlePromptChange}
                                            onFocus={() => setIsPromptFocused(true)}
                                            onBlur={() => setIsPromptFocused(false)}
                                            placeholder="Enter your query prompt..."
                                            autoSize={{ minRows: 2, maxRows: 6 }}
                                            className=""
                                            style={{
                                                padding: '12px 16px',
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700">Execution Time:</span>
                                    <span className="px-2 py-1 rounded-lg font-mono text-sm" style={{
                                        backgroundColor: '#FFE5CC',
                                        color: '#CC5500'
                                    }}>
                                        {promptData.execution_time}s
                                    </span>
                                </div>
                            </div>

                            <div className="relative bg-gray-50/50 border border-gray-200 rounded-2xl overflow-hidden">
                                <div className="absolute top-3 right-3 z-10 flex gap-2">
                                    {hasUserEditedQuery && (
                                        <span className="px-2 py-1 text-xs rounded-lg mr-2 self-center" style={{
                                            backgroundColor: '#FFE5CC',
                                            color: '#CC5500'
                                        }}>
                                            Modified
                                        </span>
                                    )}
                                    <Tooltip title="Run query">
                                        <Button
                                            icon={<FaPlay />}
                                            type="primary"
                                            loading={isRunningQuery}
                                            onClick={runInputQuery}
                                            className="flex items-center gap-1 h-8 rounded-xl border-0 text-xs hover:scale-105 transition-all duration-200"
                                            style={{
                                                background: 'linear-gradient(135deg, #FF9129 0%, #CC5500 100%)',
                                                boxShadow: '0 4px 12px rgba(255, 145, 41, 0.3)'
                                            }}
                                        >
                                            Run
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title="Copy query">
                                        <Button
                                            icon={<IoCopy />}
                                            onClick={copyQueryToClipboard}
                                            className="h-8 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 text-xs transition-all duration-200"
                                        />
                                    </Tooltip>
                                </div>
                                <SQLEditor value={inputQuery} onChange={handleQueryChange} editable={true} />
                            </div>

                            {/* Query Error Display */}
                            {queryError && (
                                <Alert
                                    message="Query Execution Failed"
                                    description={
                                        <div className="space-y-3">
                                            <div className="text-sm text-gray-700">
                                                <strong>Error:</strong> {queryError}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="small"
                                                    icon={<ReloadOutlined />}
                                                    onClick={runInputQuery}
                                                    loading={isRunningQuery}
                                                    className="rounded-lg"
                                                    style={{
                                                        backgroundColor: '#FFE5CC',
                                                        borderColor: '#FFB366',
                                                        color: '#FF9129'
                                                    }}
                                                >
                                                    Retry Query
                                                </Button>
                                                <Button
                                                    size="small"
                                                    onClick={() => setQueryError(null)}
                                                    className="rounded-lg"
                                                >
                                                    Dismiss
                                                </Button>
                                            </div>
                                        </div>
                                    }
                                    type="error"
                                    showIcon
                                    icon={<ExclamationCircleOutlined />}
                                    className="rounded-2xl border-red-200"
                                />
                            )}

                            {/* Regeneration Error Display */}
                            {(regenerationError || externalRegenerationError) && (
                                <Alert
                                    message="Regeneration Failed"
                                    description={
                                        <div className="space-y-3">
                                            <div className="text-sm text-gray-700">
                                                <strong>Error:</strong> {regenerationError || externalRegenerationError}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="small"
                                                    icon={<ReloadOutlined />}
                                                    onClick={regenerateWithUpdatedPrompt}
                                                    loading={isRegeneratingResponseTable}
                                                    className="rounded-lg"
                                                    style={{
                                                        backgroundColor: '#FFE5CC',
                                                        borderColor: '#FFB366',
                                                        color: '#FF9129'
                                                    }}
                                                >
                                                    Retry Regeneration
                                                </Button>
                                                <Button
                                                    size="small"
                                                    onClick={() => setRegenerationError(null)}
                                                    className="rounded-lg"
                                                >
                                                    Dismiss
                                                </Button>
                                            </div>
                                        </div>
                                    }
                                    type="error"
                                    showIcon
                                    icon={<ExclamationCircleOutlined />}
                                    className="rounded-2xl border-red-200"
                                />
                            )}
                        </div>

                        {/* Query Results */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#FFE5CC' }}>
                                        <LuSearchCode className="text-sm" style={{ color: '#FF9129' }} />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-0">Query Results</h3>
                                </div>

                                <Tooltip title="Export results as CSV">
                                    <Button
                                        icon={<FiDownload />}
                                        onClick={exportToCSV}
                                        disabled={promptData.table.length === 0}
                                        className="flex items-center gap-2 h-9 px-4 rounded-xl border-2 transition-all duration-200 hover:shadow-sm"
                                        style={{
                                            backgroundColor: promptData.table.length > 0 ? '#FFE5CC' : '#f5f5f5',
                                            borderColor: promptData.table.length > 0 ? '#FFB366' : '#d9d9d9',
                                            color: promptData.table.length > 0 ? '#FF9129' : '#999999'
                                        }}
                                    >
                                        <span className="text-sm font-medium">Export CSV</span>
                                    </Button>
                                </Tooltip>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                <Table
                                    dataSource={promptData.table}
                                    columns={columns}
                                    scroll={{ x: "auto", y: 400 }}
                                    pagination={{
                                        pageSize: 10,
                                        showSizeChanger: true,
                                        showQuickJumper: true,
                                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                                        className: "px-4 py-2"
                                    }}
                                    size="small"
                                    className="border-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
