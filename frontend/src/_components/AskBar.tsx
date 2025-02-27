import { useState } from 'react';
import { Input, Button } from 'antd';
import { MdOutlineArrowUpward as ArrowIcon } from "react-icons/md"

const { TextArea } = Input;

interface AskBarProps {
    onSend: (input: string) => Promise<void>;
    loading?: boolean;
}

const AskBar = ({ onSend, loading }: AskBarProps) => {
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;
        onSend(input).then(() => setInput(''));
    };

    return (
        <div style={{ display: 'flex', alignItems: 'end', padding: '10px', border: '2px solid #f0f0f0', borderRadius: '30px' }}>
            <TextArea rows={4} value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your table anything..."
                autoSize={{ minRows: 2, maxRows: 4 }}
                style={{ flex: 1, border: '0px' ,padding: '10px', boxShadow: 'none' }}
            />
            <Button
                type="primary"
                icon={<ArrowIcon className='text-xl'/>}
                onClick={handleSend}
                style={{ marginLeft: '10px', borderRadius: '50%', width: '35px', height: '35px' }}
                loading={loading}
            />
        </div>
    );
};

export default AskBar;
