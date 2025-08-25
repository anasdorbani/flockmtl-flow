import React, { useState, useEffect } from 'react';
import { Select, Card, Typography, Tag, Button, message, Collapse, Space } from 'antd';
import { DatabaseOutlined, TableOutlined, CheckOutlined, ClearOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { FiTable, FiDatabase, FiGrid, FiColumns, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

interface TableInfo {
    table_name: string;
    row_count: number;
    columns: string[];
}

interface TableSelectorProps {
    selectedTables: string[];
    onTablesChange: (tables: string[]) => void;
    refreshTrigger?: number;
}

const TableSelector: React.FC<TableSelectorProps> = ({
    selectedTables,
    onTablesChange,
    refreshTrigger
}) => {
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedTables, setExpandedTables] = useState<string[]>([]);

    const fetchTables = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/data/tables');
            setTables(response.data.tables || []);
        } catch (error) {
            message.error('Failed to fetch tables');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, [refreshTrigger]);

    const handleSelectAll = () => {
        const allTableNames = tables.map(table => table.table_name);
        onTablesChange(allTableNames);
    };

    const handleClearAll = () => {
        onTablesChange([]);
    };

    const getTableInfo = (tableName: string) => {
        return tables.find(table => table.table_name === tableName);
    };

    const toggleTableExpansion = (tableName: string) => {
        setExpandedTables(prev =>
            prev.includes(tableName)
                ? prev.filter(t => t !== tableName)
                : [...prev, tableName]
        );
    };

    const expandAllTables = () => {
        setExpandedTables([...selectedTables]);
    };

    const collapseAllTables = () => {
        setExpandedTables([]);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 rounded-xl">
                            <FiTable className="text-orange-600 text-lg" style={{ color: '#FF9129' }} />
                        </div>
                        <div>
                            <Title level={5} className="mb-0 text-gray-900">
                                Select Tables
                            </Title>
                            <Text className="text-gray-500 text-sm">
                                Choose which tables to include in your queries
                            </Text>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="small"
                            type="text"
                            onClick={handleSelectAll}
                            disabled={!tables.length}
                            className="flex items-center gap-1 hover:bg-orange-50"
                            style={{ color: '#FF9129' }}
                            icon={<CheckOutlined />}
                        >
                            All
                        </Button>
                        <Button
                            size="small"
                            type="text"
                            onClick={handleClearAll}
                            disabled={!selectedTables.length}
                            className="flex items-center gap-1 text-gray-600 hover:bg-gray-50"
                            icon={<ClearOutlined />}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {tables.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="p-4 bg-gray-50 rounded-2xl w-fit mx-auto mb-4">
                            <FiDatabase className="text-3xl text-gray-400" />
                        </div>
                        <Text className="text-gray-500 block mb-2">No tables available</Text>
                        <Text className="text-gray-400 text-sm">Upload some data to get started</Text>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Select
                            mode="multiple"
                            className="w-full"
                            placeholder="Search and select tables..."
                            value={selectedTables}
                            onChange={onTablesChange}
                            loading={loading}
                            maxTagCount="responsive"
                            size="large"
                            style={{
                                borderRadius: '12px'
                            }}
                        >
                            {tables.map(table => (
                                <Option key={table.table_name} value={table.table_name}>
                                    <div className="flex justify-between items-center py-1">
                                        <div className="flex items-center gap-2">
                                            <FiTable className="text-gray-400" />
                                            <span className="font-medium">{table.table_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Tag className="bg-orange-50 border-orange-200 rounded-lg" style={{ color: '#FF9129', borderColor: '#FFB366' }}>
                                                {table.row_count.toLocaleString()} rows
                                            </Tag>
                                            <Tag className="bg-orange-50 border-orange-200 rounded-lg" style={{ color: '#FF9129', borderColor: '#FFB366' }}>
                                                {table.columns.length} cols
                                            </Tag>
                                        </div>
                                    </div>
                                </Option>
                            ))}
                        </Select>

                        {selectedTables.length > 0 && (
                            <div className="space-y-3 animate-fadeIn">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FiGrid className="text-gray-500" />
                                        <Text strong className="text-gray-700">
                                            Selected Tables ({selectedTables.length})
                                        </Text>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="small"
                                            type="text"
                                            onClick={expandedTables.length === selectedTables.length ? collapseAllTables : expandAllTables}
                                            className="flex items-center gap-1 text-xs hover:bg-orange-50"
                                            style={{ color: '#FF9129' }}
                                            icon={<FiColumns className="text-xs" />}
                                        >
                                            {expandedTables.length === selectedTables.length ? 'Hide All Columns' : 'Show All Columns'}
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    {selectedTables.map((tableName, index) => {
                                        const tableInfo = getTableInfo(tableName);
                                        const isExpanded = expandedTables.includes(tableName);

                                        return (
                                            <div
                                                key={tableName}
                                                className="border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-sm"
                                                style={{
                                                    animationDelay: `${index * 50}ms`,
                                                    borderColor: '#FFB366',
                                                    background: 'linear-gradient(135deg, #FFF8F0 0%, #FFE5CC 100%)'
                                                }}
                                            >
                                                {/* Table header */}
                                                <div
                                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-orange-50/50 transition-colors"
                                                    onClick={() => toggleTableExpansion(tableName)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#FFE5CC' }}>
                                                            <FiTable className="text-sm" style={{ color: '#FF9129' }} />
                                                        </div>
                                                        <div>
                                                            <Text strong className="text-gray-900 block">
                                                                {tableName}
                                                            </Text>
                                                            {tableInfo && (
                                                                <Text className="text-gray-600 text-xs">
                                                                    {tableInfo.row_count.toLocaleString()} rows • {tableInfo.columns.length} columns
                                                                </Text>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            className="flex items-center gap-1 text-xs hover:bg-orange-100"
                                                            style={{ color: '#FF9129' }}
                                                            icon={isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                                                        >
                                                            {isExpanded ? 'Hide' : 'Show'} Columns
                                                        </Button>
                                                        <div className="w-1 h-8 rounded-full" style={{ backgroundColor: '#FFB366' }}></div>
                                                    </div>
                                                </div>

                                                {/* Columns section */}
                                                {isExpanded && tableInfo && (
                                                    <div className="border-t px-4 pb-4" style={{ borderColor: '#FFB366' }}>
                                                        <div className="pt-3">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <FiColumns className="text-gray-500 text-sm" />
                                                                <Text className="text-sm font-medium text-gray-700">
                                                                    Columns ({tableInfo.columns.length})
                                                                </Text>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {tableInfo.columns.map((column, colIndex) => (
                                                                    <Tag
                                                                        key={column}
                                                                        className="text-xs px-2 py-1 rounded-lg border font-mono"
                                                                        style={{
                                                                            backgroundColor: '#FFF8F0',
                                                                            borderColor: '#FFD4A3',
                                                                            color: '#B8860B',
                                                                            animationDelay: `${colIndex * 30}ms`
                                                                        }}
                                                                    >
                                                                        {column}
                                                                    </Tag>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TableSelector;
