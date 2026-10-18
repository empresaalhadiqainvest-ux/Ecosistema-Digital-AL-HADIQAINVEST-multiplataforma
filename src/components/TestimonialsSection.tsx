import React, { useState, useEffect } from 'react';
import { CommentItem, FeedbackData } from '../types';

const STORAGE_KEY = 'alhadiqa_capital_v1';

const SEED_DATA: FeedbackData = {
  ratings: [5, 4, 5, 5, 4, 5, 5, 4],
  comments: [
    {
      name: 'Carlos R.',
      stars: 5,
      text: 'Llegué sin saber nada de finanzas. El método de los 5 pasos me cambió la mentalidad: hoy ya tengo mi primer fondo de emergencia.',
      date: 'hace 2 semanas',
    },
    {
      name: 'Ana M.',
      stars: 5,
      text: 'Por fin alguien explica el interés compuesto y los fondos indexados sin humo ni promesas falsas. Clarísimo y directo al grano.',
      date: 'hace 1 mes',
    },
    {
      name: 'Diego T.',
      stars: 4,
      text: 'El cuadrante del flujo del dinero me abrió los ojos. Ahora trabajo en moverme del lado izquierdo al lado derecho.',
      date: 'hace 1 mes',
    },
    {
      name: 'Laura P.',
      stars: 5,
      text: 'Los libros gratuitos de la biblioteca valen oro. Los descargué todos y ya voy en la semana 2 del plan de 30 días.',
      date: 'hace 3 semanas',
    },
  ],
};

function getStarString(stars: number): string {
  let s = '';
  for (let i = 1; i <= 5; i++) {
    s += i <= stars ? '★' : '☆';
  }
  return s;
}

export const TestimonialsSection: React.FC = () => {
  const [data, setData] = useState<FeedbackData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.comments) && Array.isArray(parsed.ratings)) {
          return parsed;
        }
      }
    } catch {
      // Fallback to seed data
    }
    return SEED_DATA;
  });

  const [selectedStars, setSelectedStars] = useState<number>(0);
  const [hoveredStars, setHoveredStars] = useState<number>(0);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [formMsg, setFormMsg] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage failed or quota exceeded
    }
  }, [data]);

  const totalRatings = data.ratings.length;
  const avgScore = totalRatings > 0
    ? data.ratings.reduce((sum, val) => sum + val, 0) / totalRatings
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedText = text.trim();

    if (!trimmedName || !trimmedText || selectedStars === 0) {
      setFormMsg('Completa tu nombre, tu comentario y tu calificación con estrellas.');
      return;
    }

    const newComment: CommentItem = {
      name: trimmedName,
      stars: selectedStars,
      text: trimmedText,
      date: 'ahora mismo',
    };

    setData(prev => ({
      ratings: [...prev.ratings, selectedStars],
      comments: [...prev.comments, newComment],
    }));

    setName('');
    setText('');
    setSelectedStars(0);
    setHoveredStars(0);
    setFormMsg('¡Gracias! Tu comentario fue publicado.');

    setTimeout(() => {
      setFormMsg('');
    }, 5000);
  };

  const displayedStars = hoveredStars || selectedStars;

  return (
    <div style={{ marginTop: 'clamp(3.5rem, 7vw, 5.5rem)' }}>
      <div className="section-head">
        <p className="eyebrow">Comunidad</p>
        <h3 className="h-section">Lo que dice nuestra comunidad ⭐</h3>
        <p>Califica la guía y comparte tu experiencia. Tu comentario motiva a otros a empezar su camino.</p>
      </div>

      <div className="rating-box">
        <div className="rating-score-wrap">
          <span className="rating-score" id="avg-score">
            {avgScore.toFixed(1)}
          </span>
          <div className="stars" id="avg-stars" aria-hidden="true">
            {getStarString(Math.round(avgScore))}
          </div>
          <p className="votes" id="total-votes">
            {totalRatings} {totalRatings === 1 ? 'valoración' : 'valoraciones'}
          </p>
        </div>

        <div>
          <p className="rate-label">¿Te sirvió esta guía? Califícala:</p>
          <div className="stars-input" id="stars-input">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-btn ${star <= displayedStars ? 'on' : ''}`}
                aria-label={`Calificar con ${star} estrella${star > 1 ? 's' : ''}`}
                onClick={() => setSelectedStars(star)}
                onMouseEnter={() => setHoveredStars(star)}
                onMouseLeave={() => setHoveredStars(0)}
              >
                ★
              </button>
            ))}
          </div>

          <form id="comment-form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="c-name">Tu nombre</label>
            <input
              id="c-name"
              name="nombre"
              type="text"
              placeholder="Tu nombre"
              maxLength={40}
              autoComplete="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />

            <label className="sr-only" htmlFor="c-text">Tu comentario</label>
            <textarea
              id="c-text"
              name="comentario"
              rows={3}
              placeholder="Comparte tu experiencia con AL-HADIQA CAPITAL…"
              maxLength={300}
              value={text}
              onChange={e => setText(e.target.value)}
              required
            />

            <div>
              <button className="btn" type="submit">
                Publicar comentario <span className="arrow" aria-hidden="true">&rarr;</span>
              </button>
            </div>

            {formMsg && (
              <p className="form-msg" id="form-msg" role="status" aria-live="polite">
                {formMsg}
              </p>
            )}
          </form>
        </div>
      </div>

      <div className="testimonials" id="testimonials-list">
        {data.comments.slice().reverse().map((c, idx) => (
          <article key={idx} className="t-card">
            <div className="stars" aria-label={`${c.stars} de 5 estrellas`}>
              {getStarString(c.stars)}
            </div>
            <p>&laquo;{c.text}&raquo;</p>
            <footer>&mdash; {c.name} &middot; {c.date}</footer>
          </article>
        ))}
      </div>
    </div>
  );
};
