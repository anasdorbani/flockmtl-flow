import React from "react";
import { MdBuild } from "react-icons/md"; // Example icon
import NodeBox from "./NodeBox";
import type { Operator } from "../../types/pipeline";
import { Typography } from "antd";
import SQLEditor from "./SQLEditor";

interface OperatorNodeProps {
    operator: Operator;
}

const QueryNode: React.FC<OperatorNodeProps> = ({ operator }) => {
    return (
        <NodeBox Icon={MdBuild} IconColor="bg-red-400" Title="Query">
            <div className="flex flex-col gap-3 text-xs p-2">
                <SQLEditor value={operator.description} editable={false} />
            </div>
        </NodeBox>
    );
};

export default QueryNode;
