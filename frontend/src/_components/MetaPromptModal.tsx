import React, { useState } from 'react';
import { Button, Modal, Input, Space } from 'antd';
import { FaCode, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'

const { TextArea } = Input;

interface MetaPromptModalProps {
    prompt: string;
}

const MetaPromptModal: React.FC<MetaPromptModalProps> = ({ prompt }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [markdownContent, setMarkdownContent] = useState('');

    // Open Modal
    const showModal = () => {
        setMarkdownContent(generateMarkdown(prompt));
        setIsModalOpen(true);
    };

    // Close Modal
    const hideModal = () => {
        setIsModalOpen(false);
        setIsEditing(false);
    };

    // Generate markdown content dynamically
    const generateMarkdown = (promptText: string) => `

You are a semantic analysis tool for DBMS. The tool will analyze each tuple in the provided data and respond to user requests based on this context.

#### User Prompt:
- **Prompt:** ${promptText}

#### Tuples Table:
- \`<Extracted Data>\`

#### Instructions:
1. The response should be directly relevant to each tuple without additional formatting, purely answering the prompt as if each tuple were a standalone entity.
2. Use clear, context-relevant language to generate a meaningful and concise answer for each tuple.
3. Use appropriate algorithms when processing data.

#### Expected Response Format:
The system should interpret database tuples and provide a response to the user's prompt for each tuple in a BOOL format (true/false).  
The tool should respond in **JSON format** as follows:

\`\`\`json
{
    "tuples": [<bool response 1 >, <bool response 2 >, ... , <bool response n>]
}
\`\`\`
`;

    return (
        <>
            {/* Open Modal Button */}
            <Button type="primary" size="small" className="rounded-full" onClick={showModal}>
                <FaCode />
                Meta Prompt
            </Button>

            <Modal
                title="Meta Prompt"
                open={isModalOpen}
                centered
                footer={null}
                onCancel={hideModal}
                width={800}
            >
                {/* Edit Mode */}
                {isEditing ? (
                    <>
                        <TextArea
                            value={markdownContent}
                            onChange={(e) => setMarkdownContent(e.target.value)}
                            rows={10}
                        />
                        <Space style={{ marginTop: 10 }}>
                            <Button type="primary" onClick={() => setIsEditing(false)}>
                                <FaSave /> Save
                            </Button>
                            <Button onClick={() => setIsEditing(false)}>
                                <FaTimes /> Cancel
                            </Button>
                        </Space>
                    </>
                ) : (
                    <>
                        <ReactMarkdown className={'prose prose-sm'} remarkPlugins={[remarkGfm]}>
                            {markdownContent}
                        </ReactMarkdown>
                            <Button type="dashed" icon={<FaEdit />} onClick={() => setIsEditing(true)} style={{ marginTop: 10 }}>
                            Edit
                        </Button>
                    </>
                )}
            </Modal>
        </>
    );
};

export default MetaPromptModal;
