import styles from './Footer.module.css';

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <p>
                &copy; {year} Omni Coder. All rights reserved. | Developed by:
                <a
                    href="https://shakilmahmud.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                >
                    Shakil Mahmud
                </a>
            </p>
        </footer>
    );
}
