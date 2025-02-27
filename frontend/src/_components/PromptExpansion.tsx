import React, { useState } from "react";
import { IoExpand } from "react-icons/io5";
import NodeBox from "./NodeBox";
import TextArea from "antd/es/input/TextArea";

interface PromptExpansionProps {
    prompts: string[];
    setPrompts: (prompt: string[]) => void;
}

const PromptExpansion: React.FC<PromptExpansionProps> = ({ prompts, setPrompts }) => {
    const [inputPrompts, setInputPrompts] = useState(prompts);

    const handlePromptChange = (index: number, value: string) => {
        const newPrompts = [...prompts];
        newPrompts[index] = value;
        setInputPrompts(newPrompts);
        setPrompts(newPrompts);
    };

    return (
        <NodeBox Icon={IoExpand} IconColor='bg-orange-400' Title='Prompt Expansion'>
            <div className="flex flex-col gap-2">
                {inputPrompts.map((prompt, index) => (
                    <div>
                        <label className="text-[10px] font-semibold">Prompt {index + 1}</label>
                        <TextArea
                            value={prompt}
                            onChange={(e) => handlePromptChange(index, e.target.value)}
                            placeholder="Ask your table anything..."
                            autoSize={{ minRows: 1, maxRows: 5 }}
                            className="p-2 border-[1px] border-[#f0f0f0] text-[10px]"
                        />
                    </div>
                ))}
            </div>
        </NodeBox>
    );
};

export default PromptExpansion;
