import React from "react";
import { FaDatabase } from "react-icons/fa";
import { Table } from "antd";
import NodeBox from "./NodeBox";
import type { Operator } from "../../types/pipeline";

interface ResultsNodeProps {
    operator: Operator;
}

const ResultsNode: React.FC<ResultsNodeProps> = ({ operator }) => {
    // Ensure data exists and is an array
    const data = Array.isArray(operator.data) ? operator.data : [];

    // Dynamically generate table columns from data keys
    const columns = data.length > 0
        ? Object.keys(data[0]).map((key) => ({
            title: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize column headers
            dataIndex: key,
            key,
            render: (value: any) => (typeof value === "object" ? JSON.stringify(value) : value), // Handle nested objects
        }))
        : [];

    return (
        <NodeBox Icon={FaDatabase} IconColor="bg-green-400" Title={operator.name}>
            <div className="flex flex-col gap-3 text-xs p-2">

                {/* Query Execution Time */}
                <div className="flex gap-2">
                    <label className="font-semibold text-gray-700">Execution Time:</label>
                    <p className="text-gray-600">{operator.query_execution_time} s</p>
                </div>

                {/* Data Table */}
                <div className="w-full overflow-auto">
                    <label className="font-semibold text-gray-700">Data</label>
                    {data.length > 0 ? (
                        <Table
                            dataSource={data.map((row, index) => ({ ...row, key: index.toString() }))}
                            columns={columns}
                            bordered
                            size="small"
                            pagination={{ pageSize: 3 }}
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
