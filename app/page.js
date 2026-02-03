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
  const [mobileView, setMobileView] = useState('input'); // 'input' | 'solution'

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
      setMobileView('solution'); // Switch to solution view on mobile
    } catch (error) {
      console.error(error);
      setSolution({
        type: 'logic',
        explanation: `**Error**: ${error.message}`,
        code: '',
        language: 'text'
      });
      setMobileView('solution');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        {/* Left Pane: Input */}
        <div className={`${styles.pane} ${mobileView === 'solution' ? styles.mobileHidden : ''}`}>
          <div className={styles.inputContainer}>
            <textarea
              className={styles.textarea}
              placeholder="Paste your problem logic, code snippet, or web design prompt here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div style={{ padding: '0 1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <a href="/run" style={{ color: '#0070f3', textDecoration: 'none', fontSize: '0.9rem' }}>Go to Playground &rarr;</a>
            </div>
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
        <div className={`${styles.pane} ${mobileView === 'input' ? styles.mobileHidden : ''}`}>
          <div className={styles.solutionContainer}>
            {!solution ? (
              <div className={styles.emptyState}>
                <Sparkles size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Ready to solve. <br />Enter your Code or Logic problem on the left.</p>
              </div>
            ) : (
              <>
                {/* We need a back button visible ONLY on mobile */}
                <button
                  className={styles.mobileBackBtn || 'mobileBackBtn'} // We need to define this in module if not present
                  style={{
                    display: 'none', // hidden on desktop by default via CSS media query if possible
                    // But since we can't easily add global CSS, let's use inline for now or assume module class
                    // standard approach:
                  }}
                  onClick={() => setMobileView('input')}
                >
                  ← Edit Input
                </button>
                <style jsx>{`
                  @media (min-width: 769px) {
                    button[class*="mobileBackBtn"] {
                      display: none !important;
                    }
                  }
                  @media (max-width: 768px) {
                    button[class*="mobileBackBtn"] {
                      display: flex !important;
                      margin-bottom: 1rem;
                      padding: 0.5rem;
                      background: transparent;
                      border: 1px solid #333;
                      color: inherit;
                      border-radius: 4px;
                      cursor: pointer;
                    }
                  }
                `}</style>
                <SolutionViewer solution={solution} />
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
