'use client';

import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import styles from './run.module.css';
import Link from 'next/link';
import Footer from '../../components/Footer';

const LANGUAGES = [
    { id: 'python', name: 'Python' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'c', name: 'C' },
    { id: 'cpp', name: 'C++' },
    { id: 'java', name: 'Java' },
    { id: 'go', name: 'Go' }
];

export default function RunPage() {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    // Interactive State
    const [accumulatedStdin, setAccumulatedStdin] = useState([]); // Array of inputs
    const [currentInput, setCurrentInput] = useState('');
    const [waitingForInput, setWaitingForInput] = useState(false);

    const terminalInputRef = useRef(null);

    useEffect(() => {
        // Load code from localStorage on mount
        const storedCode = localStorage.getItem('omni_run_code');
        const storedLang = localStorage.getItem('omni_run_lang');

        if (storedCode) setCode(storedCode);
        if (storedLang) setLanguage(storedLang);

        // Initial clean state
        setOutput('Ready to run.');
    }, []);

    const executeCode = async (stdinValueOverride = null) => {
        setIsRunning(true);
        setWaitingForInput(false);

        // Use override if provided (for recursive calls), else use state
        const stdinToSend = stdinValueOverride !== null ? stdinValueOverride : accumulatedStdin;

        try {
            const response = await fetch('/api/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    language,
                    stdin: stdinToSend
                }),
            });

            const data = await response.json();
            let rawOutput = data.output || 'No output.';

            // Check for waiting token
            if (rawOutput.includes('<WAITING_FOR_INPUT>')) {
                setWaitingForInput(true);
                rawOutput = rawOutput.replace('<WAITING_FOR_INPUT>', '').trimEnd();
                // Auto focus input when waiting
                setTimeout(() => terminalInputRef.current?.focus(), 100);
            }

            setOutput(rawOutput);

        } catch (err) {
            setOutput(prev => prev + `\nExecution Error: ${err.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    const handleInitialRun = () => {
        setOutput('Running...');
        setAccumulatedStdin([]);
        setWaitingForInput(false);
        executeCode([]); // Start with empty stdin array
    };

    const handleInputSend = () => {
        const inputToSend = currentInput;
        const newStdin = [...accumulatedStdin, inputToSend];

        setAccumulatedStdin(newStdin);
        setCurrentInput('');

        // Optimistically update terminal to show what user typed
        setOutput(prev => prev + inputToSend + '\n');

        executeCode(newStdin);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h1 className={styles.title}>Omni Coder</h1>
                </Link>
                <div className={styles.controls}>
                    <select
                        className={styles.select}
                        value={language}
                        onChange={(e) => {
                            setLanguage(e.target.value);
                            localStorage.setItem('omni_run_lang', e.target.value);
                        }}
                    >
                        {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>

                    <button
                        className={styles.runButton}
                        onClick={handleInitialRun}
                        disabled={isRunning && !waitingForInput}
                    >
                        <Play size={16} />
                        Run
                    </button>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.editorSection}>
                    <textarea
                        className={styles.editor}
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value);
                            localStorage.setItem('omni_run_code', e.target.value);
                        }}
                        placeholder="Type your code here..."
                        spellCheck="false"
                    />
                </div>

                <div className={styles.outputSection}>
                    <div className={styles.outputHeader}>Terminal Output</div>
                    <div
                        className={styles.terminal}
                        onClick={() => terminalInputRef.current?.focus()}
                    >
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {output}
                            {waitingForInput && (
                                <span style={{ display: 'inline-block' }}>
                                    <input
                                        ref={terminalInputRef}
                                        type="text"
                                        value={currentInput}
                                        onChange={(e) => setCurrentInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleInputSend();
                                            }
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#fff',
                                            fontFamily: 'inherit',
                                            fontSize: 'inherit',
                                            outline: 'none',
                                            padding: 0,
                                            margin: 0,
                                            width: `${Math.max(1, currentInput.length + 1)}ch`,
                                            minWidth: '10px',
                                            caretColor: '#fff'
                                        }}
                                        autoFocus
                                        autoComplete="off"
                                    />
                                    <span className={styles.waitingBlob} />
                                </span>
                            )}
                        </div>
                        {isRunning && !waitingForInput && (
                            <div style={{ color: '#666', marginTop: '1rem' }}>Processing...</div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
