import { useState, useEffect } from 'react';
import { Input, Button, Tag, Tooltip, Popover, message } from 'antd';
import { FiSend, FiPlus, FiDatabase, FiX, FiColumns } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import TableSelector from "@/_components/TableSelector";
import axios from 'axios';

const { TextArea } = Input;

interface AskBarProps {
    onSend: (input: string, selectedTables?: string[]) => Promise<void>;
    loading?: boolean;
    disabled?: boolean;
    placeholder?: string;
    selectedTables?: string[];
    onTablesChange?: (tables: string[]) => void;
    tableRefreshTrigger?: number;
}

const AskBar = ({
    onSend,
    loading,
    disabled = false,
    placeholder = "Ask your table anything...",
    selectedTables = [],
    onTablesChange,
    tableRefreshTrigger
}: AskBarProps) => {
    const [input, setInput] = useState('');
    const [openTables, setOpenTables] = useState(false);
    const [focused, setFocused] = useState(false);
    const [showColumns, setShowColumns] = useState(false);
    const [tableData, setTableData] = useState<Array<{
        table_name: string;
        row_count: number;
        columns: string[];
    }>>([]);
    const [loadingTableData, setLoadingTableData] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || disabled || selectedTables.length === 0) return;

        try {
            await onSend(input, selectedTables);
            setInput('');
        } catch (error) {
            // Error handling is done in parent component
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTextareaClick = () => {
        if (selectedTables.length === 0) {
            setOpenTables(true);
        }
    };

    const removeTable = (tableToRemove: string) => {
        const newTables = selectedTables.filter(t => t !== tableToRemove);
        onTablesChange?.(newTables);
    };

    const getTableInfo = (tableName: string) => {
        return tableData.find(table => table.table_name === tableName);
    };

    const fetchTableData = async () => {
        if (selectedTables.length === 0 || tableData.length > 0) return;

        try {
            setLoadingTableData(true);
            const response = await axios.get('/api/data/tables');
            setTableData(response.data.tables || []);
        } catch (error) {
            message.error('Failed to fetch table data');
        } finally {
            setLoadingTableData(false);
        }
    };

    const handleShowColumns = () => {
        if (!showColumns && tableData.length === 0) {
            fetchTableData();
        }
        setShowColumns(!showColumns);
    };

    // Refresh table data when tables change or refresh trigger updates
    useEffect(() => {
        if (selectedTables.length > 0 && showColumns) {
            fetchTableData();
        }
    }, [tableRefreshTrigger]);

    // Clear table data when no tables are selected
    useEffect(() => {
        if (selectedTables.length === 0) {
            setTableData([]);
            setShowColumns(false);
        }
    }, [selectedTables.length]);

    const tablesContent = (
        <div className="w-[640px] max-w-[90vw] max-h-[70vh] overflow-auto">
            <TableSelector
                selectedTables={selectedTables}
                onTablesChange={onTablesChange || (() => { })}
                refreshTrigger={tableRefreshTrigger}
            />
        </div>
    );

    const canSend = input.trim() && selectedTables.length > 0 && !disabled && !loading;

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="relative">
                {/* Main container */}
                <div
                    className={`
                        relative bg-white border-2 rounded-3xl shadow-lg transition-all duration-300
                        ${focused
                            ? 'shadow-xl scale-[1.01]'
                            : 'border-gray-200 hover:border-gray-300'
                        }
                        ${loading ? 'opacity-75' : ''}
                    `}
                    style={{
                        borderColor: focused ? '#FF9129' : undefined,
                        boxShadow: focused ? '0 20px 40px rgba(255, 145, 41, 0.15), 0 0 0 4px rgba(255, 145, 41, 0.08)' : undefined
                    }}
                >
                    {/* Selected tables */}
                    {selectedTables.length > 0 && (
                        <div className="px-6 pt-6 pb-3 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 rounded-lg" style={{ backgroundColor: '#FFE5CC' }}>
                                        <FiDatabase className="text-xs" style={{ color: '#FF9129' }} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                        Selected Tables ({selectedTables.length})
                                    </span>
                                </div>

                                <Button
                                    size="small"
                                    type="text"
                                    onClick={handleShowColumns}
                                    loading={loadingTableData}
                                    className="flex items-center gap-1 text-xs hover:bg-orange-50"
                                    style={{ color: '#FF9129' }}
                                    icon={<FiColumns />}
                                >
                                    {showColumns ? 'Hide' : 'Show'} Columns
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {selectedTables.map((table, index) => {
                                    const tableInfo = getTableInfo(table);
                                    return (
                                        <div key={table} className="space-y-2">
                                            <Tag
                                                closable
                                                onClose={() => removeTable(table)}
                                                className="flex items-center gap-1 px-3 py-1.5 border rounded-xl font-medium transition-all duration-200 hover:shadow-sm w-fit"
                                                style={{
                                                    backgroundColor: '#FFE5CC',
                                                    borderColor: '#FFB366',
                                                    color: '#CC5500'
                                                }}
                                                closeIcon={<FiX className="hover:opacity-70" style={{ color: '#FF9129' }} />}
                                            >
                                                <FiDatabase className="text-xs" />
                                                {table}
                                                {tableInfo && (
                                                    <span className="text-xs opacity-70">
                                                        ({tableInfo.columns.length} cols)
                                                    </span>
                                                )}
                                                {!tableInfo && showColumns && (
                                                    <span className="text-xs opacity-50">
                                                        (loading...)
                                                    </span>
                                                )}
                                            </Tag>

                                            {showColumns && tableInfo && (
                                                <div className="ml-4 flex flex-wrap gap-1">
                                                    {tableInfo.columns.map((column: string) => (
                                                        <Tag
                                                            key={`${table}-${column}`}
                                                            className="text-xs px-2 py-0.5 rounded-md font-mono"
                                                            style={{
                                                                backgroundColor: '#FFF8F0',
                                                                borderColor: '#FFD4A3',
                                                                color: '#B8860B',
                                                                fontSize: '10px'
                                                            }}
                                                        >
                                                            {column}
                                                        </Tag>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Input section */}
                    <div className="flex items-end gap-4 p-6">
                        {/* Table selector */}
                        <Popover
                            content={tablesContent}
                            open={openTables}
                            onOpenChange={setOpenTables}
                            placement="topLeft"
                            trigger={["click"]}
                            overlayClassName="table-selector-popover"
                        >
                            <Tooltip title="Select tables" placement="top">
                                <Button
                                    className={`
                                        relative flex-shrink-0 w-12 h-12 rounded-2xl border-2 transition-all duration-200
                                        ${selectedTables.length > 0
                                            ? 'hover:shadow-sm'
                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                                        }
                                    `}
                                    style={{
                                        backgroundColor: selectedTables.length > 0 ? '#FFE5CC' : undefined,
                                        color: selectedTables.length > 0 ? '#FF9129' : undefined
                                    }}
                                    icon={<FiPlus className="text-lg" />}
                                >
                                    {selectedTables.length > 0 && (
                                        <div className="absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold" style={{ backgroundColor: '#FF9129' }}>
                                            {selectedTables.length}
                                        </div>
                                    )}
                                </Button>
                            </Tooltip>
                        </Popover>

                        {/* Text input */}
                        <div className="flex-1 min-h-[48px] flex items-center relative">
                            {/* Invisible overlay to capture clicks when textarea is disabled */}
                            {selectedTables.length === 0 && (
                                <div
                                    className="absolute inset-0 z-10 cursor-pointer"
                                    onClick={handleTextareaClick}
                                />
                            )}
                            <TextArea
                                rows={1}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                placeholder={selectedTables.length === 0 ? "Click to select tables first..." : placeholder}
                                autoSize={{ minRows: 1, maxRows: 6 }}
                                disabled={selectedTables.length === 0 || disabled}
                                className="border-0 shadow-none resize-none bg-transparent text-lg placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-0"
                                style={{
                                    padding: 10,
                                    fontSize: '16px',
                                    lineHeight: '24px',
                                    border: 'none',
                                    outline: 'none',
                                    boxShadow: 'none'
                                }}
                            />
                        </div>

                        {/* Send button */}
                        <Tooltip
                            title={
                                selectedTables.length === 0
                                    ? 'Select tables first'
                                    : canSend
                                        ? 'Send message'
                                        : 'Type a message to send'
                            }
                            placement="top"
                        >
                            <Button
                                type="primary"
                                size="large"
                                loading={loading}
                                disabled={!canSend}
                                onClick={handleSend}
                                className={`
                                    flex-shrink-0 w-12 h-12 rounded-2xl border-0 flex items-center justify-center transition-all duration-200
                                    ${canSend
                                        ? 'hover:shadow-xl hover:scale-105'
                                        : 'bg-gray-200 cursor-not-allowed'
                                    }
                                `}
                                style={{
                                    background: canSend
                                        ? 'linear-gradient(135deg, #FF9129 0%, #CC5500 100%)'
                                        : undefined,
                                    boxShadow: canSend
                                        ? '0 8px 20px rgba(255, 145, 41, 0.3)'
                                        : '0 4px 12px rgba(0, 0, 0, 0.08)'
                                }}
                                icon={
                                    loading ? (
                                        <HiSparkles className="text-lg animate-spin" />
                                    ) : (
                                        <FiSend className="text-lg" />
                                    )
                                }
                            />
                        </Tooltip>
                    </div>
                </div>

                {/* Helper text */}
                <div className="mt-4 text-center">
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded-md font-mono text-xs">
                                Enter
                            </kbd>
                            <span>to send</span>
                        </div>
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        <div className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded-md font-mono text-xs">
                                Shift + Enter
                            </kbd>
                            <span>for new line</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AskBar;
