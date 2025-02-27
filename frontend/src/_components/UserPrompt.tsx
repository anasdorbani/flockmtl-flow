import React, { useState } from "react";
import { IoDocumentText } from "react-icons/io5";
import NodeBox from "./NodeBox";
import TextArea from "antd/es/input/TextArea";



interface UserPromptProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
}

const UserPrompt: React.FC<UserPromptProps> = ({ prompt, setPrompt }) => {
    const [inputPrompt, setInputPrompt] = useState(prompt);

    const handlePromptChange = (value: string) => {
        setInputPrompt(value);
        setPrompt(value);
    }

    return (
        <NodeBox Icon={IoDocumentText} IconColor='bg-yellow-400' Title='User Prompt'>
            <TextArea
                value={inputPrompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder="Ask your table anything..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                className="p-2 border-[1px] border-[#f0f0f0] text-[10px]"
            />
        </NodeBox>
    );
};

export default UserPrompt;
