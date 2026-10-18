import React from 'react';
import { BookGuide } from '../types';

const BOOKS: BookGuide[] = [
  {
    title: '7 Hábitos Financieros para tu Libertad',
    description: 'Los 7 hábitos que transforman tu relación con el dinero, con un plan de acción de 30 días para empezar hoy mismo.',
    filename: '/libros/7-habitos-financieros.pdf',
    colorVar: 'var(--gold)',
    icon: '📕',
  },
  {
    title: 'El Presupuesto 50/30/20',
    description: 'Guía práctica paso a paso con ejemplo numérico y plantilla mensual para tomar el control de tu dinero desde hoy.',
    filename: '/libros/presupuesto-50-30-20.pdf',
    colorVar: 'var(--emerald)',
    icon: '📗',
  },
  {
    title: 'El Cuadrante del Flujo del Dinero',
    description: 'Resumen práctico con el plan de acción para moverte de los ingresos activos (E-A) a los pasivos (D-I).',
    filename: '/libros/cuadrante-flujo-del-dinero.pdf',
    colorVar: 'var(--blue)',
    icon: '📘',
  },
];

export const LibrarySection: React.FC = () => {
  return (
    <div style={{ marginTop: 'clamp(3.5rem, 7vw, 5.5rem)' }}>
      <div className="section-head">
        <p className="eyebrow">Biblioteca gratuita</p>
        <h3 className="h-section">Libros para crear hábitos financieros 📚</h3>
        <p>
          Descarga gratis las guías de AL-HADIQA CAPITAL en PDF. Léelas, aplica una idea por semana y conviértela en hábito.
        </p>
      </div>

      <div className="cards">
        {BOOKS.map((book) => (
          <article
            key={book.title}
            className="card"
            style={{ ['--accent' as string]: book.colorVar }}
          >
            <div className="card__icon" aria-hidden="true">
              {book.icon}
            </div>
            <h4 className="h-card">{book.title}</h4>
            <div className="card__rule" aria-hidden="true"></div>
            <p>{book.description}</p>
            <a
              className="btn btn--ghost book-dl"
              href={book.filename}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              Descargar PDF <span className="arrow" aria-hidden="true">&darr;</span>
            </a>
          </article>
        ))}
      </div>
    </div>
  );
};
