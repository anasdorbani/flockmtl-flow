import React, { useState } from "react";
import { MdOutlineInsights } from "react-icons/md";
import NodeBox from "./NodeBox";
import TextArea from "antd/es/input/TextArea";



interface FinalResultsProps {
    results: {
        data: object;
        summary: string;
    }
}

const FinalResults: React.FC<FinalResultsProps> = ({ results }) => {
    const [outputResults, setOutputResults] = useState(results);

    return (
        <NodeBox Icon={MdOutlineInsights} IconColor='bg-green-400' Title='Final Results'>
            <div className="flex flex-col gap-2 text-[10px]">
                <div>
                    <label className="font-semibold">Summary</label>
                    <p>{outputResults.summary}</p>
                </div>
                <div className="overflow-x-auto">
                    <label className="font-semibold">Data</label>
                    <TextArea
                        value={JSON.stringify(outputResults.data)}
                        autoSize={{ minRows: 1, maxRows: 9 }}
                        className="p-2 border-[1px] border-[#f0f0f0] text-[10px] font-mono"
                        disabled
                    />
                </div>
            </div>
        </NodeBox>
    );
};

export default FinalResults;
