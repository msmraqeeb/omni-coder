'use client';

import { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css'; // Dark theme
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function CodeBlock({ code, language }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        Prism.highlightAll();
    }, [code, language]);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ position: 'relative', margin: '1rem 0' }}>
            <button
                onClick={handleCopy}
                style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#fff',
                    padding: '0.25rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    zIndex: 10,
                }}
                title="Copy Code"
            >
                {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <pre className={`language-${language}`} style={{ borderRadius: '8px', margin: 0 }}>
                <code className={`language-${language}`}>{code}</code>
            </pre>
        </div>
    );
}
