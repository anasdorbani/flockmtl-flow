import React from "react";
import { MdBuild } from "react-icons/md"; // Example icon
import NodeBox from "./NodeBox";
import type { Operator } from "../../types/pipeline";

interface OperatorNodeProps {
    operator: Operator;
}

const OperatorNode: React.FC<OperatorNodeProps> = ({ operator }) => {
    return (
        <NodeBox Icon={MdBuild} IconColor="bg-blue-400" Title="Classic Operator">
            <div className="flex flex-col gap-3 text-xs p-2">
                {/* Name */}
                <div>
                    <label className="font-semibold text-gray-700">Name</label>
                    <p className="text-gray-600">{operator.name}</p>
                </div>

                {/* Description */}
                <div>
                    <label className="font-semibold text-gray-700">Description</label>
                    <p className="text-gray-600">{operator.description}</p>
                </div>
            </div>
        </NodeBox>
    );
};

export default OperatorNode;
