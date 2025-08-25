import React, { useEffect, useRef, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Input, Select, InputNumber, Tag, Button } from "antd";
import type { InputRef } from "antd/es/input";
import { MdOutlineInsights } from "react-icons/md";
import NodeBox from "./NodeBox";
import type { Operator } from "../../types/pipeline";
import MetaPromptModal from "./MetaPromptModal";
import { CiEdit } from "react-icons/ci";

const { TextArea } = Input;

interface ScalarFunctionNodeProps {
    operator: Operator;
    handlePipelineInputChange: (operatorId: number, field: string, value: any, type?: string) => void;
}

const ScalarFunctionNode: React.FC<ScalarFunctionNodeProps> = ({ operator, handlePipelineInputChange }) => {
    const params = operator.params as any; // Type assertion to handle params properly
    const [contextColumns, setContextColumns] = useState<Array<{ data: string, name: string }>>(params?.context_columns || []);
    const [edited, setEdited] = useState(false);
    const [tupleFormat, setTupleFormat] = useState<string>(params?.tuple_format || 'XML');

    // For adding new context columns
    const [inputVisible, setInputVisible] = useState(false);
    const [inputColumnData, setInputColumnData] = useState("");
    const [inputColumnName, setInputColumnName] = useState("");
    const inputRef = useRef<InputRef>(null);

    useEffect(() => {
        if (inputVisible) {
            inputRef.current?.focus();
        }
    }, [inputVisible]);

    // Sync state with operator changes
    useEffect(() => {
        setTupleFormat(params?.tuple_format || 'XML');
        setContextColumns(params?.context_columns || []);
    }, [params?.tuple_format, params?.context_columns]);

    const handleRemoveContextColumn = (index: number) => {
        const updatedColumns = contextColumns.filter((_, i) => i !== index);
        setContextColumns(updatedColumns);
        handlePipelineInputChange(operator.id, "context_columns", updatedColumns);
    };

    const showInput = () => setInputVisible(true);

    const handleColumnDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputColumnData(e.target.value);
    };

    const handleColumnNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputColumnName(e.target.value);
    };

    const handleInputConfirm = () => {
        if (inputColumnData && inputColumnName) {
            const newColumn = { data: inputColumnData, name: inputColumnName };
            const updatedColumns = [...contextColumns, newColumn];
            setContextColumns(updatedColumns);
            handlePipelineInputChange(operator.id, "context_columns", updatedColumns);
        }
        setInputVisible(false);
        setInputColumnData("");
        setInputColumnName("");
    };

    const handleFunctionInputChange = (field: string, value: any) => {
        setEdited(true);
        if (field === "tuple_format") {
            setTupleFormat(value);
        }
        handlePipelineInputChange(operator.id, field, value);
    };

    return (
        <NodeBox Icon={MdOutlineInsights} IconColor="bg-orange-400" Title="FlockMTL Function">
            <div className="flex flex-col gap-3 text-xs p-2">
                {edited && (
                    <div className="absolute text-right text-xs text-gray-500 right-4 flex items-center">
                        <CiEdit className="inline mr-1" />
                        Edited
                    </div>
                )}
                {/* Name (Static) */}
                <div>
                    <label className="font-semibold text-gray-700">Name</label>
                    <p className="text-gray-600">{operator.name}</p>
                </div>

                {/* Description */}
                <div>
                    <label className="font-semibold text-gray-700">Description</label>
                    <p className="text-gray-600">{operator.description}</p>
                </div>

                {/* Model Name */}
                <div>
                    <label className="font-semibold text-gray-700">Model</label>
                    <Input
                        name="model_name"
                        defaultValue={params?.model_name}
                        onChange={(e) => handleFunctionInputChange("model_name", e.target.value)}
                        className="text-xs"
                    />
                </div>

                {/* Prompt */}
                <div>
                    <label className="font-semibold text-gray-700 flex justify-between items-center mb-2">
                        Prompt
                        <MetaPromptModal prompt={params?.prompt} />
                    </label>
                    <TextArea
                        name="prompt"
                        defaultValue={params?.prompt}
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        onChange={(e) => handleFunctionInputChange("prompt", e.target.value)}
                        className="text-xs"
                    />
                </div>

                {/* Context Columns */}
                <div>
                    <label className="font-semibold text-gray-700">Context Columns</label>
                    <div className="flex flex-col gap-2 border border-gray-300 p-2 rounded-md">
                        {contextColumns.map((column, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex-1">
                                    <span className="font-medium text-xs">{column.name}:</span>
                                    <span className="ml-2 text-xs text-gray-600">{column.data}</span>
                                </div>
                                <Button
                                    size="small"
                                    type="text"
                                    onClick={() => handleRemoveContextColumn(index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    ×
                                </Button>
                            </div>
                        ))}
                        {inputVisible ? (
                            <div className="flex gap-2 p-2 bg-blue-50 rounded">
                                <Input
                                    ref={inputRef}
                                    size="small"
                                    placeholder="Column name (e.g., bio_text)"
                                    value={inputColumnName}
                                    onChange={handleColumnNameChange}
                                    onPressEnter={handleInputConfirm}
                                />
                                <Input
                                    size="small"
                                    placeholder="Data expression (e.g., bio::VARCHAR)"
                                    value={inputColumnData}
                                    onChange={handleColumnDataChange}
                                    onBlur={handleInputConfirm}
                                    onPressEnter={handleInputConfirm}
                                />
                            </div>
                        ) : (
                            <Tag onClick={showInput} className="border-dashed cursor-pointer">
                                <PlusOutlined /> New Context Column
                            </Tag>
                        )}
                    </div>
                </div>

                {/* Batch Size */}
                <div>
                    <label className="font-semibold text-gray-700">Batch Size</label>
                    <InputNumber
                        defaultValue={params?.batch_size}
                        min={1}
                        className="w-full text-xs"
                        placeholder="Auto"
                        onChange={(value) => handleFunctionInputChange("batch_size", value)}
                    />
                </div>

                {/* Tuple Format */}
                <div>
                    <label className="font-semibold text-gray-700">Tuple Serialization</label>
                    <Select
                        value={tupleFormat}
                        className="w-full text-xs"
                        onChange={(value) => handleFunctionInputChange("tuple_format", value)}
                        dropdownStyle={{ zIndex: 9999 }}
                        getPopupContainer={(trigger) => trigger.parentElement || document.body}
                        options={[
                            { value: "Markdown", label: "Markdown" },
                            { value: "XML", label: "XML" },
                            { value: "JSON", label: "JSON" },
                        ]}
                    />
                </div>
            </div>
        </NodeBox>
    );
};

export default ScalarFunctionNode;
