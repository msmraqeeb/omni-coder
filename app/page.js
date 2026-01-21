'use client';

import { useState } from 'react';
import Header from '../components/Header';
import styles from './page.module.css';
import { Sparkles } from 'lucide-react';
import SolutionViewer from '../components/SolutionViewer';
import Footer from '../components/Footer';

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState(null);
  const [language, setLanguage] = useState('auto');

  const handleSolve = async () => {
    if (!input.trim()) return;
    setLoading(true);

    // Real API Call
    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, language: language }),
      });

      if (!res.ok) throw new Error('Failed to fetch solution');

      const data = await res.json();
      setSolution(data);
    } catch (error) {
      console.error(error);
      setSolution({
        type: 'logic',
        explanation: `**Error**: ${error.message}`,
        code: '',
        language: 'text'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        {/* Left Pane: Input */}
        <div className={styles.pane}>
          <div className={styles.inputContainer}>
            <textarea
              className={styles.textarea}
              placeholder="Paste your problem logic, code snippet, or web design prompt here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className={styles.controls}>
              <select
                className={styles.languageSelect}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="auto">Auto Detect Language</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="csharp">C#</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="web">Web (HTML/CSS/JS)</option>
              </select>
              <button
                className={styles.solveButton}
                onClick={handleSolve}
                disabled={loading}
              >
                <Sparkles size={20} />
                {loading ? 'Solving...' : 'Solve it'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Pane: Solution */}
        <div className={styles.pane}>
          <div className={styles.solutionContainer}>
            {!solution ? (
              <div className={styles.emptyState}>
                <Sparkles size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Ready to solve. <br />Enter your Code or Logic problem on the left.</p>
              </div>
            ) : (
              <SolutionViewer solution={solution} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
