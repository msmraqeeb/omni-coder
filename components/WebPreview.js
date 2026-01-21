
import { useEffect, useRef } from 'react';

export default function WebPreview({ html, css, js }) {
    const iframeRef = useRef(null);

    useEffect(() => {
        if (iframeRef.current) {
            const doc = iframeRef.current.contentDocument;
            const content = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              ${css}
            </style>
          </head>
          <body>
            ${html}
            <script>
              try {
                ${js}
              } catch (err) {
                console.error(err);
              }
            </script>
          </body>
        </html>
      `;
            doc.open();
            doc.write(content);
            doc.close();
        }
    }, [html, css, js]);

    return (
        <iframe
            ref={iframeRef}
            title="Live Preview"
            style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#fff' // Web pages usually expect white bg by default
            }}
        />
    );
}
