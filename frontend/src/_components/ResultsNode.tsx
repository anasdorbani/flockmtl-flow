import React from "react";
import { FaDatabase } from "react-icons/fa";
import { Table, Button, Spin } from "antd";
import NodeBox from "./NodeBox";
import type { Operator } from "../../types/pipeline";
import { FaGears, FaPlay } from "react-icons/fa6";

interface ResultsNodeProps {
    operator: Operator;
}

const ResultsNode: React.FC<ResultsNodeProps> = ({ operator }) => {
    const [executed, setExecuted] = React.useState(false);
    const [isExecuting, setIsExecuting] = React.useState(false);

    // Ensure data exists and is an array
    const data = Array.isArray(operator.data) ? operator.data : [];

    // Dynamically generate table columns from data keys
    const columns = data.length > 0
        ? Object.keys(data[0]).map((key) => ({
            title: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize column headers
            dataIndex: key,
            key,
            render: (value: any) => (typeof value === "object" ? JSON.stringify(value) : value),
            ellipsis: true,
        }))
        : [];

    return (
        <NodeBox Icon={FaDatabase} IconColor="bg-green-400" Title={operator.name}>
            <div className="flex flex-col gap-1 text-xs p-2">

                {/* Metrics */}
                <div className="flex gap-1">
                    <label className="font-semibold text-gray-700">Execution Time:</label>
                    <p className="text-gray-600">{operator.metrics?.execution_time} s</p>
                </div>
                <div className="flex gap-1">
                    <label className="font-semibold text-gray-700">Rows:</label>
                    <p className="text-gray-600">{operator.data?.length}</p>
                </div>
                <div className="flex gap-1">
                    <label className="font-semibold text-gray-700">Columns:</label>
                    <p className="text-gray-600">{operator.data?.[0] ? Object.keys(operator.data[0]).length : 0}</p>
                </div>

                {/* Data Table */}
                <div className="w-full overflow-auto">
                    <label className="block font-semibold text-gray-700 mb-2">Results Table</label>
                    {data.length > 0 ? (
                        <Table
                            dataSource={data.map((row, index) => ({ ...row, key: index.toString() }))}
                            columns={columns}
                            bordered
                            size="small"
                            pagination={{ pageSize: 4, hideOnSinglePage: true }}
                            scroll={{ x: "auto" }}
                        />
                    ) : (
                        <p className="text-gray-600">No data available</p>
                    )}
                </div>
            </div>
        </NodeBox>
    );
};

export default ResultsNode;
