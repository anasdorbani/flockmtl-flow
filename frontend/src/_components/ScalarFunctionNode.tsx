import React, { useEffect, useRef, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Input, Select, InputNumber, Tag, Button } from "antd";
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
    const [tags, setTags] = useState<string[]>(operator.params?.input_columns || []);
    const [edited, setEdited] = useState(false);

    // For adding new tags (input columns)
    const [inputVisible, setInputVisible] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<Input>(null);

    useEffect(() => {
        if (inputVisible) {
            inputRef.current?.focus();
        }
    }, [inputVisible]);

    const handleClose = (removedTag: string) => {
        const updatedTags = tags.filter((tag) => tag !== removedTag);
        setTags(updatedTags);
        handlePipelineInputChange(operator.id, "input_columns", updatedTags);
    };

    const showInput = () => setInputVisible(true);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputConfirm = () => {
        if (inputValue && !tags.includes(inputValue)) {
            const updatedTags = [...tags, inputValue];
            setTags(updatedTags);
            handlePipelineInputChange(operator.id, "input_columns", updatedTags);
        }
        setInputVisible(false);
        setInputValue("");
    };

    const handleFunctionInputChange = (field: string, value: any) => {
        setEdited(true);
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
                        defaultValue={operator.params?.model_name}
                        onChange={(e) => handleFunctionInputChange("model_name", e.target.value)}
                        className="text-xs"
                    />
                </div>

                {/* Prompt */}
                <div>
                    <label className="font-semibold text-gray-700 flex justify-between items-center block mb-2">
                        Prompt
                        <MetaPromptModal prompt={operator.params?.prompt} />
                    </label>
                    <TextArea
                        name="prompt"
                        defaultValue={operator.params?.prompt}
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        onChange={(e) => handleFunctionInputChange("prompt", e.target.value)}
                        className="text-xs"
                    />
                </div>

                {/* Input Columns (Tag System) */}
                <div>
                    <label className="font-semibold text-gray-700">Relevant Columns</label>
                    <div className="flex flex-wrap gap-2 border border-gray-300 p-2 rounded-md">
                        {tags.map((tag) => (
                            <Tag key={tag} closable onClose={() => handleClose(tag)}>
                                {tag}
                            </Tag>
                        ))}
                        {inputVisible ? (
                            <Input
                                ref={inputRef}
                                type="text"
                                size="small"
                                className="w-24"
                                defaultValue={inputValue}
                                onChange={handleInputChange}
                                onBlur={handleInputConfirm}
                                onPressEnter={handleInputConfirm}
                            />
                        ) : (
                            <Tag onClick={showInput} className="border-dashed">
                                <PlusOutlined /> New Column
                            </Tag>
                        )}
                    </div>
                </div>

                {/* Batch Size */}
                <div>
                    <label className="font-semibold text-gray-700">Batch Size</label>
                    <InputNumber
                        defaultValue={operator.params?.batch_size}
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
                        defaultValue={operator.params?.tuple_format ?? 'XML'}
                        className="w-full text-xs"
                        onChange={(value) => handleFunctionInputChange("tuple_format", value)}
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
