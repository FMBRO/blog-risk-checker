import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore } from '../store/appStore';

export function MarkdownPreview() {
    const { editorText } = useAppStore();

    return (
        <div className="h-full w-full bg-white overflow-auto p-8">
            <div className="prose prose-slate max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {editorText}
                </ReactMarkdown>
            </div>
        </div>
    );
}
