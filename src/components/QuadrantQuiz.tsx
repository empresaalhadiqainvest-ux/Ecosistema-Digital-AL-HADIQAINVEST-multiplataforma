import React, { useState } from 'react';
import { QuadrantType, QuadrantInfo } from '../types';

const QUADRANTS: QuadrantInfo[] = [
  {
    code: 'E',
    title: 'Empleado',
    badge: 'E',
    description: 'Cambias tiempo por un salario. Es el cuadrante más seguro… y más dependiente: si tú te detienes, tu ingreso también.',
    accent: 'var(--muted-2)',
    advice: 'Eres Empleado: tu ingreso depende de tu tiempo. Tu siguiente paso es crear un presupuesto y pagarte primero, para empezar a construir activos.',
  },
  {
    code: 'A',
    title: 'Autónomo / Especialista',
    badge: 'A',
    description: 'Tienes oficio propio y ganas más, pero todo depende de tu esfuerzo directo. Eres tu propio jefe… y tu propio empleado.',
    accent: 'var(--blue)',
    advice: 'Eres Autónomo: ganas bien, pero todo depende de ti. Sistematiza tu trabajo y convierte tu habilidad en un activo que genere sin tu presencia.',
  },
  {
    code: 'D',
    title: 'Dueño de Negocio',
    badge: 'D',
    description: 'Un sistema y un equipo generan los ingresos. Tu presencia deja de ser el límite: el negocio trabaja aunque tú no estés.',
    accent: 'var(--gold)',
    advice: 'Eres Dueño de negocio: tu sistema trabaja para ti. Tu foco ahora es reinvertir las utilidades y escalar hacia el cuadrante Inversor.',
  },
  {
    code: 'I',
    title: 'Inversor',
    badge: 'I',
    description: 'Tu capital trabaja para ti: interés compuesto, fondos indexados y activos que pagan. El cuadrante de la verdadera libertad.',
    accent: 'var(--emerald)',
    advice: 'Eres Inversor: tu dinero trabaja para ti. Protege tu capital con diversificación y mantén la disciplina del largo plazo.',
  },
];

export const QuadrantQuiz: React.FC = () => {
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantType | null>(null);

  const handleSelect = (code: QuadrantType) => {
    setSelectedQuadrant(code);
  };

  const selectedInfo = QUADRANTS.find(q => q.code === selectedQuadrant);

  return (
    <div style={{ marginTop: 'clamp(3.5rem, 7vw, 5.5rem)' }}>
      <div className="section-head">
        <p className="eyebrow">El mapa del dinero</p>
        <h3 className="h-section">El Cuadrante del Flujo del Dinero</h3>
        <p>
          Del clásico <em>Padre Rico, Padre Pobre</em> de Robert Kiyosaki: la forma en que generas tu dinero determina tu libertad. El camino va de los ingresos activos (izquierda) a los ingresos pasivos (derecha). Toca tu cuadrante actual y descubre tu siguiente paso.
        </p>
      </div>

      <div className="quadrant-legend">
        <span className="pill">
          <span className="dot" style={{ ['--accent' as string]: 'var(--muted-2)' }}></span>
          Ingresos activos · trabajas por dinero
        </span>
        <span className="pill" style={{ ['--accent' as string]: 'var(--gold)' }}>
          <span className="dot"></span>
          Ingresos pasivos · el dinero trabaja para ti
        </span>
      </div>

      <div className="quadrant-grid">
        {QUADRANTS.map(q => {
          const isSelected = selectedQuadrant === q.code;
          const isPassive = q.code === 'D' || q.code === 'I';
          return (
            <div
              key={q.code}
              className={`quad ${isPassive ? 'quad--active' : ''} ${isSelected ? 'quad--selected' : ''}`}
              style={{ ['--qc' as string]: q.accent, cursor: 'pointer' }}
              onClick={() => handleSelect(q.code)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSelect(q.code);
                }
              }}
              aria-label={`Cuadrante ${q.code}: ${q.title}`}
            >
              <span className="quad__letter" aria-hidden="true">{q.badge}</span>
              <h4>{q.title}</h4>
              <p>{q.description}</p>
            </div>
          );
        })}
      </div>

      <div className="quiz">
        <p>
          <strong style={{ color: 'var(--text)' }}>¿En qué cuadrante estás hoy?</strong>
        </p>
        <div className="quiz__opts">
          {QUADRANTS.map(q => (
            <button
              key={q.code}
              type="button"
              className={`quiz__btn ${selectedQuadrant === q.code ? 'active' : ''}`}
              aria-pressed={selectedQuadrant === q.code}
              onClick={() => handleSelect(q.code)}
            >
              {q.code} · {q.title}
            </button>
          ))}
        </div>
        <p id="quiz-result" role="status" aria-live="polite">
          {selectedInfo ? selectedInfo.advice : 'Selecciona tu cuadrante para ver tu diagnóstico y plan de acción.'}
        </p>
      </div>
    </div>
  );
};
