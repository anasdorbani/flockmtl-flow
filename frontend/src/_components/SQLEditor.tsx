import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";

interface SQLEditorProps {
    value: string;
    onChange?: any;
    editable?: boolean;
}

const SQLEditor = ({ value, onChange, editable }: SQLEditorProps) => (
    <CodeMirror
        value={value}
        className='border-[1px] rounded-[20px] p-4'
        extensions={[sql()]}
        onChange={onChange}
        editable={editable}
    />
);

export default SQLEditor;