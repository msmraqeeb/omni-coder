import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CodeBlock from './CodeBlock';
import WebPreview from './WebPreview';
import styles from './SolutionViewer.module.css';

export default function SolutionViewer({ solution }) {
    const router = useRouter();
    // web mode state
    const [activeTab, setActiveTab] = useState('preview');
    // logic mode state
    const [output, setOutput] = useState('');
    const [accumulatedStdin, setAccumulatedStdin] = useState(''); // All inputs sent so far
    const [currentInput, setCurrentInput] = useState(''); // Current input user is typing
    const [waitingForInput, setWaitingForInput] = useState(false);
    const [isRunning, setIsRunning] = useState(false);

    const [showRunView, setShowRunView] = useState(false); // Mobile only

    // Reset output when solution changes
    useEffect(() => {
        setOutput('');
        setShowRunView(false);
    }, [solution]);

    const executeCode = async (stdinValue) => {
        const lang = solution.language ? solution.language.toLowerCase() : 'text';
        setIsRunning(true);
        setWaitingForInput(false);

        // For simple JS client-side execution (non-interactive mostly)
        if (lang === 'javascript' || lang === 'js') {
            // ... (client side JS runner logic remains similar but simplified context)
            try {
                let logs = [];
                const originalLog = console.log;
                console.log = (...args) => {
                    logs.push(args.map(a => String(a)).join(' '));
                    originalLog(...args);
                };
                const run = new Function(solution.code);
                run();
                console.log = originalLog;
                setOutput(logs.join('\n') || 'Code executed successfully.');
                setIsRunning(false);
            } catch (err) {
                setOutput(`Error: ${err.message}`);
                setIsRunning(false);
            }
            return;
        }

        // Server-side interactive execution
        try {
            const response = await fetch('/api/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: solution.code,
                    language: lang,
                    stdin: stdinValue
                }),
            });

            const data = await response.json();
            let rawOutput = data.output || 'No output.';

            // Check for waiting token
            if (rawOutput.includes('<WAITING_FOR_INPUT>')) {
                setWaitingForInput(true);
                rawOutput = rawOutput.replace('<WAITING_FOR_INPUT>', '').trimEnd();
            }

            setOutput(rawOutput);

        } catch (err) {
            setOutput(prev => prev + `\nExecution Error: ${err.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    const handleRunRedirect = () => {
        // Save code and language to localStorage
        localStorage.setItem('omni_run_code', solution.code);
        localStorage.setItem('omni_run_lang', solution.language ? solution.language.toLowerCase() : 'text');

        // Redirect to run page
        router.push('/run');
    };

    if (solution.type === 'logic') {
        return (
            <div className={styles.container}>
                <div className={styles.content}>
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

                    <div style={{ marginTop: '2rem' }}>
                        <button
                            className={styles.runButton}
                            onClick={handleRunRedirect}
                        >
                            Run Code in Playground
                        </button>
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
