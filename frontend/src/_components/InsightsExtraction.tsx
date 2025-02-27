import React, { useState } from "react";
import { FaMagnifyingGlassChart } from "react-icons/fa6";
import NodeBox from "./NodeBox";
import TextArea from "antd/es/input/TextArea";

interface InsightsExtractionProps {
    prompt: string;
    query: string;
    setInsightsExtractionData: (prompt: string, query: string) => void;
}

const InsightsExtraction: React.FC<InsightsExtractionProps> = ({ prompt, query, setInsightsExtractionData }) => {
    const [inputPrompt, setInputPrompt] = useState(prompt);
    const [inputQuery, setInputQuery] = useState(query);

    const handlePromptChange = (value: string) => {
        setInputPrompt(value);
        setInsightsExtractionData(value, inputQuery);
    };

    const handleQueryChange = (value: string) => {
        setInputQuery(value);
        setInsightsExtractionData(inputPrompt, value);
    };

    return (
        <NodeBox Icon={FaMagnifyingGlassChart} IconColor='bg-blue-400' Title='Insights Extraction'>
            <div className="flex flex-col gap-2">
                <div>
                    <label className="text-[10px] font-semibold">Prompt</label>
                    <TextArea
                        value={inputPrompt}
                        onChange={(e) => handlePromptChange(e.target.value)}
                        placeholder="Ask your table anything..."
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        className="p-2 border-[1px] border-[#f0f0f0] text-[10px]"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-semibold">Flock Query</label>
                    <TextArea
                        value={inputQuery}
                        onChange={(e) => handleQueryChange(e.target.value)}
                        placeholder="Ask your table anything..."
                        autoSize={{ minRows: 1, maxRows: 9 }}
                        className="p-2 border-[1px] border-[#f0f0f0] text-[10px] font-mono"
                    />
                </div>
            </div>
        </NodeBox>
    );
};

export default InsightsExtraction;
