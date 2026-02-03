import styles from './Header.module.css';
import { Network } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
    return (
        <header className={styles.header}>
            <Link href="/" className={styles.logo} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Network className={styles.icon} />
                Omni Coder
            </Link>
            <div className={styles.actions}>
                {/* Placeholder for future auth or settings */}
            </div>
        </header>
    );
}
