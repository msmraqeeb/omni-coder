import { useState, useEffect } from 'react';
import CodeBlock from './CodeBlock';
import WebPreview from './WebPreview';
import styles from './SolutionViewer.module.css';

export default function SolutionViewer({ solution }) {
    // web mode state
    const [activeTab, setActiveTab] = useState('preview');
    // logic mode state
    const [output, setOutput] = useState('');

    // Reset output when solution changes
    useEffect(() => {
        setOutput('');
    }, [solution]);

    const handleRun = async () => {
        if (!solution || !solution.code) return;

        setOutput('Running...');

        const lang = solution.language ? solution.language.toLowerCase() : 'text';

        if (lang === 'javascript' || lang === 'js') {
            try {
                // safer capture of console.log
                let logs = [];
                const originalLog = console.log;
                console.log = (...args) => {
                    logs.push(args.map(a => String(a)).join(' '));
                    originalLog(...args);
                };

                // Create a function from the code and run it
                // We wrap it in an async IIFE to support await if needed, though strictly we construct a Function
                // This is a basic client-side runner
                const run = new Function(solution.code);
                run();

                console.log = originalLog;

                if (logs.length > 0) {
                    setOutput(logs.join('\n'));
                } else {
                    setOutput('Code executed successfully (no output).');
                }
            } catch (err) {
                setOutput(`Error: ${err.message}`);
            }
        } else {
            // Server-side simulation for other languages
            try {
                const response = await fetch('/api/run', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code: solution.code,
                        language: lang
                    }),
                });

                const data = await response.json();
                if (data.output) {
                    setOutput(data.output);
                } else {
                    setOutput('No output received.');
                }
            } catch (err) {
                setOutput(`Execution Error: ${err.message}`);
            }
        }
    };

    if (!solution) return null;

    if (solution.type === 'logic') {
        return (
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.section}>
                        <h3 className={styles.title}>Explanation</h3>
                        <div className={styles.text}>{solution.explanation}</div>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.title}>Solution Code</h3>
                        <CodeBlock code={solution.code} language={solution.language || 'javascript'} />
                    </div>

                    {solution.complexity && (
                        <div className={styles.meta}>
                            <strong>Complexity Analysis:</strong>
                            <div className={styles.text}>{solution.complexity}</div>
                        </div>
                    )}

                    <div className={styles.section} style={{ marginTop: '1.5rem' }}>
                        <h3 className={styles.title}>Run Code</h3>
                        <button className={styles.runButton} onClick={handleRun}>Run Code</button>
                        {output && (
                            <div className={styles.output}>
                                <strong>Output:</strong>
                                <div>{output}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (solution.type === 'web') {
        const tabs = ['preview', 'html', 'css', 'javascript'];

        return (
            <div className={styles.container}>
                <div className={styles.tabs}>
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <div className={styles.content} style={{ height: activeTab === 'preview' ? '100%' : 'auto' }}>
                    {activeTab === 'preview' && (
                        <WebPreview html={solution.html} css={solution.css} js={solution.js} />
                    )}
                    {activeTab === 'html' && <CodeBlock code={solution.html} language="html" />}
                    {activeTab === 'css' && <CodeBlock code={solution.css} language="css" />}
                    {activeTab === 'javascript' && <CodeBlock code={solution.js} language="javascript" />}
                </div>
            </div>
        );
    }

    return <div>Unknown solution type</div>;
}
