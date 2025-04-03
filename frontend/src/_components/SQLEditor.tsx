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
        className='border-[1px] rounded-[20px] py-12 px-2'
        extensions={[sql()]}
        onChange={onChange}
        editable={editable}
    />
);

export default SQLEditor;