import React from "react";
import { MdBuild } from "react-icons/md"; // Example icon
import NodeBox from "./NodeBox";
import type { Operator } from "../../types/pipeline";
import { Input } from "antd";

interface OperatorNodeProps {
    operator: Operator;
}

const PromptNode: React.FC<OperatorNodeProps> = ({ operator }) => {
    return (
        <NodeBox Icon={MdBuild} IconColor="bg-yellow-400" Title="User Prompt">
            <Input disabled value={operator.description} className="text-gray-600 text-center rounded-[20px]" />
        </NodeBox>
    );
};

export default PromptNode;
