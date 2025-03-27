import React from "react";
import { IconType } from "react-icons";

interface NodeBoxProps {
    Icon: IconType;
    IconColor: string;
    Title: string;
    children: React.ReactNode;
}

const NodeBox: React.FC<NodeBoxProps> = ({ Icon, IconColor, Title, children }) => {
    return (
        <div className="flex flex-col gap-2 w-[250px]">
            <div className="flex items-center gap-2">
                <div className={`flex items-center rounded-[7px] p-1 ${IconColor} text-white`}>
                    <Icon className="text-white" />
                </div>
                <p className="font-bold">
                    {Title}
                </p>
            </div>
            <div>
                {children}
            </div>
        </div>
    );
};

export default NodeBox;
