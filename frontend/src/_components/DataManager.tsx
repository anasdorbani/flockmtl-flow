import React, { useState, useEffect } from 'react';
import { Upload, Button, Table, Card, Space, message, Modal, Typography, Tabs, Popconfirm, Tooltip } from 'antd';
import { InboxOutlined, DeleteOutlined, EyeOutlined, DatabaseOutlined, FileTextOutlined } from '@ant-design/icons';
import { FiDatabase, FiUpload, FiRefreshCw, FiTrash2, FiEye, FiFile } from 'react-icons/fi';
import axios from 'axios';

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface TableInfo {
    table_name: string;
    row_count: number;
    columns: string[];
    original_filename?: string;
}

interface DataManagerProps {
    onTablesUpdate: () => void;
}

const DataManager: React.FC<DataManagerProps> = ({ onTablesUpdate }) => {
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [uploadingCsv, setUploadingCsv] = useState(false);
    const [uploadingDuckdb, setUploadingDuckdb] = useState(false);

    const fetchTables = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/data/tables');
            setTables(response.data.tables || []);
            onTablesUpdate();
        } catch (error) {
            message.error('Failed to fetch tables');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    const handleCsvUpload = async (options: any) => {
        const { file, onSuccess, onError } = options;

        try {
            setUploadingCsv(true);
            const formData = new FormData();
            formData.append('files', file);

            const response = await axios.post('/api/data/upload-csv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            message.success(response.data.message);
            onSuccess('ok');
            await fetchTables();
        } catch (error: any) {
            message.error(error.response?.data?.detail || 'Upload failed');
            onError(error);
        } finally {
            setUploadingCsv(false);
        }
    };

    const handleDuckDbUpload = async (options: any) => {
        const { file, onSuccess, onError } = options;

        try {
            setUploadingDuckdb(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post('/api/data/upload-duckdb', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            message.success(response.data.message);
            onSuccess('ok');
            await fetchTables();
        } catch (error: any) {
            message.error(error.response?.data?.detail || 'Upload failed');
            onError(error);
        } finally {
            setUploadingDuckdb(false);
        }
    };

    const handlePreview = async (tableName: string) => {
        try {
            const response = await axios.get(`/api/data/tables/${tableName}/preview`);
            setPreviewData(response.data);
            setPreviewVisible(true);
        } catch (error) {
            message.error('Failed to load table preview');
        }
    };

    const handleDeleteTable = async (tableName: string) => {
        try {
            await axios.delete(`/api/data/tables/${tableName}/delete`);
            message.success(`Table ${tableName} deleted successfully`);
            await fetchTables();
        } catch (error) {
            message.error('Failed to delete table');
        }
    };

    const tableColumns = [
        {
            title: 'Table Name',
            dataIndex: 'table_name',
            key: 'table_name',
            render: (text: string) => (
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg" style={{ backgroundColor: '#FFE5CC' }}>
                        <FiDatabase className="text-xs" style={{ color: '#FF9129' }} />
                    </div>
                    <Text strong className="text-gray-900">{text}</Text>
                </div>
            ),
        },
        {
            title: 'Rows',
            dataIndex: 'row_count',
            key: 'row_count',
            render: (count: number) => (
                <span className="px-2 py-1 rounded-lg font-mono text-sm" style={{
                    backgroundColor: '#FFE5CC',
                    color: '#CC5500'
                }}>
                    {count.toLocaleString()}
                </span>
            ),
        },
        {
            title: 'Columns',
            dataIndex: 'columns',
            key: 'columns',
            render: (columns: string[]) => (
                <span className="text-gray-600 font-medium">
                    {columns.length} columns
                </span>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: TableInfo) => (
                <Space size="small">
                    <Tooltip title="Preview table data">
                        <Button
                            icon={<FiEye />}
                            onClick={() => handlePreview(record.table_name)}
                            className="flex items-center gap-1 h-8 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                        >
                            Preview
                        </Button>
                    </Tooltip>
                    <Popconfirm
                        title="Delete table"
                        description="Are you sure you want to delete this table?"
                        onConfirm={() => handleDeleteTable(record.table_name)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete table">
                            <Button
                                danger
                                icon={<FiTrash2 />}
                                className="flex items-center gap-1 h-8 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                            >
                                Delete
                            </Button>
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const previewColumns = previewData?.columns.map((col: string) => ({
        title: col,
        dataIndex: col,
        key: col,
        ellipsis: true,
    }));

    const tabItems = [
        {
            key: '1',
            label: (
                <div className="flex items-center gap-2">
                    <FiFile className="text-sm" />
                    <span>CSV Files</span>
                </div>
            ),
            children: (
                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-md hover:scale-[1.01]" style={{ borderColor: '#FFB366' }}>
                        <Dragger
                            name="files"
                            multiple={true}
                            accept=".csv"
                            customRequest={handleCsvUpload}
                            showUploadList={false}
                            disabled={uploadingCsv}
                            className="!bg-transparent !border-none !p-0"
                        >
                            <div className="p-3 rounded-2xl mx-auto mb-4 w-fit" style={{ backgroundColor: '#FFE5CC' }}>
                                <FiUpload className="text-2xl" style={{ color: '#FF9129' }} />
                            </div>
                            <p className="text-lg font-semibold text-gray-900 mb-2">Click or drag CSV files to upload</p>
                            <p className="text-sm text-gray-600">
                                Support for multiple CSV files. Each file will become a separate table.
                            </p>
                        </Dragger>
                    </div>
                    {uploadingCsv && (
                        <div className="text-center py-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: '#FFE5CC', color: '#CC5500' }}>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                                <span className="font-medium">Uploading CSV files...</span>
                            </div>
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: '2',
            label: (
                <div className="flex items-center gap-2">
                    <FiDatabase className="text-sm" />
                    <span>DuckDB Database</span>
                </div>
            ),
            children: (
                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-md hover:scale-[1.01]" style={{ borderColor: '#FFB366' }}>
                        <Dragger
                            name="file"
                            multiple={false}
                            accept=".db,.duckdb"
                            customRequest={handleDuckDbUpload}
                            showUploadList={false}
                            disabled={uploadingDuckdb}
                            className="!bg-transparent !border-none !p-0"
                        >
                            <div className="p-3 rounded-2xl mx-auto mb-4 w-fit" style={{ backgroundColor: '#FFE5CC' }}>
                                <FiDatabase className="text-2xl" style={{ color: '#FF9129' }} />
                            </div>
                            <p className="text-lg font-semibold text-gray-900 mb-2">Click or drag a DuckDB database file</p>
                            <p className="text-sm text-gray-600">
                                Upload a .db or .duckdb file to import all tables from the database.
                            </p>
                        </Dragger>
                    </div>
                    {uploadingDuckdb && (
                        <div className="text-center py-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: '#FFE5CC', color: '#CC5500' }}>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                                <span className="font-medium">Uploading DuckDB database...</span>
                            </div>
                        </div>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="space-y-6">
                {/* Upload Data Section */}
                <div className="relative bg-white border-2 border-gray-200 rounded-3xl shadow-lg transition-all duration-300 hover:shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl" style={{ backgroundColor: '#FFE5CC' }}>
                                <FiUpload className="text-lg" style={{ color: '#FF9129' }} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-0">Upload Data</h2>
                                <p className="text-sm text-gray-500">Add CSV files or DuckDB databases</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <Tabs
                            items={tabItems}
                            className="data-manager-tabs"
                        />
                    </div>
                </div>

                {/* Available Tables Section */}
                <div className="relative bg-white border-2 border-gray-200 rounded-3xl shadow-lg transition-all duration-300 hover:shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl" style={{ backgroundColor: '#FFE5CC' }}>
                                <FiDatabase className="text-lg" style={{ color: '#FF9129' }} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-0">Available Tables</h2>
                                <p className="text-sm text-gray-500">Manage your uploaded data tables</p>
                            </div>
                        </div>

                        <Tooltip title="Refresh table list">
                            <Button
                                loading={loading}
                                onClick={fetchTables}
                                icon={<FiRefreshCw />}
                                className="flex items-center gap-2 h-10 rounded-xl border-2 transition-all duration-200 hover:shadow-sm"
                                style={{
                                    backgroundColor: '#FFE5CC',
                                    borderColor: '#FFB366',
                                    color: '#FF9129'
                                }}
                            >
                                Refresh
                            </Button>
                        </Tooltip>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                            <Table
                                dataSource={tables}
                                columns={tableColumns}
                                loading={loading}
                                rowKey="table_name"
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

            {/* Preview Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ backgroundColor: '#FFE5CC' }}>
                            <FiEye className="text-lg" style={{ color: '#FF9129' }} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-0">
                                Preview: {previewData?.table_name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-0">
                                Table data preview
                            </p>
                        </div>
                    </div>
                }
                open={previewVisible}
                onCancel={() => setPreviewVisible(false)}
                footer={null}
                width={900}
                className="preview-modal"
            >
                {previewData && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 p-4 rounded-xl" style={{ backgroundColor: '#FFF8F0' }}>
                            <span className="text-sm font-medium text-gray-700">
                                Showing {previewData.showing} of {previewData.data.length} rows
                            </span>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                            <Table
                                dataSource={previewData.data}
                                columns={previewColumns}
                                pagination={false}
                                scroll={{ x: true, y: 400 }}
                                size="small"
                                className="border-0"
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default DataManager;
