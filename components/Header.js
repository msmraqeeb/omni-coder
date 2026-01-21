import styles from './Header.module.css';
import { Network } from 'lucide-react';

export default function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                <Network className={styles.icon} />
                Omni Coder
            </div>
            <div className={styles.actions}>
                {/* Placeholder for future auth or settings */}
            </div>
        </header>
    );
}
