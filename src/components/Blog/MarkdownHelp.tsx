import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const MarkdownHelp: React.FC<MarkdownHelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const examples = [
    {
      title: "Encabezados",
      markdown: "# Encabezado 1\n## Encabezado 2\n### Encabezado 3",
      description: "Usa # para crear encabezados. Más # = encabezado más pequeño."
    },
    {
      title: "Texto en negrita y cursiva",
      markdown: "**Texto en negrita**\n*Texto en cursiva*\n***Negrita y cursiva***",
      description: "Usa ** para negrita y * para cursiva."
    },
    {
      title: "Enlaces",
      markdown: "[Texto del enlace](https://ejemplo.com)\n[Google](https://google.com)",
      description: "Formato: [texto que se muestra](URL)"
    },
    {
      title: "Listas",
      markdown: "- Elemento 1\n- Elemento 2\n- Elemento 3\n\n1. Primer elemento\n2. Segundo elemento\n3. Tercer elemento",
      description: "Usa - para listas sin orden y números para listas ordenadas."
    },
    {
      title: "Código",
      markdown: "Código en línea: `console.log('Hola')`\n\n```javascript\n// Bloque de código\nfunction saludar(nombre) {\n  console.log(`Hola ${nombre}!`);\n}\n```",
      description: "Usa ` para código en línea y ``` para bloques de código."
    },
    {
      title: "Citas",
      markdown: "> Esta es una cita\n> Puede tener múltiples líneas\n>\n> Y párrafos separados",
      description: "Usa > al inicio de cada línea para crear citas."
    },
    {
      title: "Tablas",
      markdown: "| Columna 1 | Columna 2 | Columna 3 |\n|-----------|-----------|----------|\n| Dato 1    | Dato 2    | Dato 3   |\n| Dato 4    | Dato 5    | Dato 6   |",
      description: "Usa | para separar columnas y - para separar encabezados."
    },
    {
      title: "Líneas horizontales",
      markdown: "Texto antes\n\n---\n\nTexto después",
      description: "Usa --- para crear una línea horizontal."
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="markdown-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📖 Guía de Markdown</h2>
          <button 
            onClick={onClose}
            className="close-btn"
            aria-label="Cerrar ayuda"
          >
            ✕
          </button>
        </div>
        
        <div className="modal-content">
          <div className="help-intro">
            <p>
              <strong>Markdown</strong> te permite formatear texto de manera fácil y rápida. 
              Aquí tienes ejemplos de cómo usarlo en tus comentarios:
            </p>
          </div>

          <div className="help-sections">
            {examples.map((example, index) => (
              <div key={index} className="help-section">
                <h3>{example.title}</h3>
                <p className="help-description">{example.description}</p>
                
                <div className="help-example">
                  <div className="example-input">
                    <h4>📝 Escribes:</h4>
                    <pre><code>{example.markdown}</code></pre>
                  </div>
                  
                  <div className="example-output">
                    <h4>👁️ Se ve así:</h4>
                    <div className="markdown-preview">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({node, ...props}) => (
                            <a {...props} target="_blank" rel="noopener noreferrer" />
                          )
                        }}
                      >
                        {example.markdown}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="help-tips">
            <h3>💡 Consejos útiles</h3>
            <ul>
              <li>Usa la pestaña "Vista previa" para ver cómo se verá tu comentario antes de publicarlo</li>
              <li>Puedes combinar diferentes formatos, por ejemplo: **negrita con *cursiva***</li>
              <li>Deja líneas en blanco entre párrafos para mejor legibilidad</li>
              <li>Los enlaces se abren en una nueva pestaña automáticamente</li>
              <li>El código se resalta automáticamente si especificas el lenguaje</li>
            </ul>
          </div>

          <div className="help-quick-reference">
            <h3>🚀 Referencia rápida</h3>
            <div className="quick-ref-grid">
              <div className="quick-ref-item">
                <code>**negrita**</code>
                <span>→</span>
                <strong>negrita</strong>
              </div>
              <div className="quick-ref-item">
                <code>*cursiva*</code>
                <span>→</span>
                <em>cursiva</em>
              </div>
              <div className="quick-ref-item">
                <code>`código`</code>
                <span>→</span>
                <code>código</code>
              </div>
              <div className="quick-ref-item">
                <code>[enlace](url)</code>
                <span>→</span>
                <a href="#">enlace</a>
              </div>
              <div className="quick-ref-item">
                <code># Título</code>
                <span>→</span>
                <strong style={{fontSize: '1.2em'}}>Título</strong>
              </div>
              <div className="quick-ref-item">
                <code>- lista</code>
                <span>→</span>
                <span>• lista</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkdownHelp;