import React from 'react';
import { QuadrantQuiz } from './QuadrantQuiz';
import { LibrarySection } from './LibrarySection';
import { TestimonialsSection } from './TestimonialsSection';

export const CapitalSection: React.FC = () => {
  return (
    <section className="section section--alt capital" id="capital">
      <div className="glow glow--cap" aria-hidden="true"></div>
      <div className="glow glow--cap2" aria-hidden="true"></div>

      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">División 04 · Educación Financiera</p>
          <h2 className="h-section capital-title">
            AL-HADIQA <span className="gradient-text">CAPITAL</span>
          </h2>
          <p className="lead" style={{ margin: '1.1rem auto 0', fontWeight: 500, color: 'var(--text)' }}>
            Tu camino a la libertad financiera 💰
          </p>
          <p style={{ color: 'var(--muted)', marginTop: '0.8rem' }}>
            Educación financiera real, sin humo y sin promesas falsas. Para jóvenes y adultos que quieren tomar el control de su dinero.
          </p>
          <p className="h-card" style={{ marginTop: '1.4rem', color: 'var(--gold)' }}>
            ¿Qué es la libertad financiera y cómo empezar desde cero?
          </p>
        </div>

        <div className="split capital-intro">
          <div className="stack">
            <p className="eyebrow">La idea central</p>
            <p className="body-text">
              La libertad financiera es el punto en que tus <strong>activos</strong> (inversiones, negocios, activos digitales) generan ingresos suficientes para cubrir tu estilo de vida, y tu tiempo vuelve a ser tuyo. No es dejar de trabajar ni hacerse rico de la noche a la mañana: es un <strong>sistema</strong> que cualquier persona disciplinada puede construir desde cero. Aquí no reinventamos la rueda: aplicamos el mismo método que usan los inversores de largo plazo, explicado paso a paso y sin humo.
            </p>
          </div>
          <blockquote className="quote-banner">
            <p>&laquo;Los hombres luchan y Dios concede la victoria.&raquo;</p>
            <small>Filosofía AL-HADIQAINVEST · Tú pones el esfuerzo y la constancia; los resultados llegan.</small>
          </blockquote>
        </div>

        <div className="section-head" style={{ marginTop: 'clamp(3rem, 6vw, 4.5rem)' }}>
          <p className="eyebrow">Dos pilares, un solo camino</p>
          <h3 className="h-section">
            Primero dominas tu dinero,<br />
            luego tu dinero trabaja para ti
          </h3>
        </div>

        <div className="cards capital-cards">
          <article className="card" style={{ ['--accent' as string]: 'var(--gold)' }}>
            <div className="card__icon" aria-hidden="true">💵</div>
            <h4 className="h-card">Pilar 1 · Finanzas personales</h4>
            <div className="card__rule" aria-hidden="true"></div>
            <p>
              Ahorro, presupuestos y control de tu dinero desde cero. La base sin la cual ninguna inversión sobrevive: saber exactamente cuánto entra, cuánto sale y hacia dónde va cada unidad.
            </p>
            <ul className="checklist" style={{ marginTop: '1rem' }}>
              <li>Regla de oro: págate a ti primero (mínimo 10% de cada ingreso).</li>
              <li>Presupuesto 50/30/20: necesidades, gustos y ahorro.</li>
              <li>Fondo de emergencia: 3 a 6 meses de gastos protegidos.</li>
            </ul>
          </article>

          <article className="card" style={{ ['--accent' as string]: 'var(--emerald)' }}>
            <div className="card__icon" aria-hidden="true">📈</div>
            <h4 className="h-card">Pilar 2 · Inversión básica</h4>
            <div className="card__rule" aria-hidden="true"></div>
            <p>
              Interés compuesto, fondos indexados y estrategias de largo plazo. Invertir no es apostar: es comprar activos productivos de forma constante y dejar que el tiempo haga la mayor parte del trabajo.
            </p>
            <ul className="checklist" style={{ marginTop: '1rem' }}>
              <li>Interés compuesto: el dinero que genera dinero.</li>
              <li>Fondos indexados: diversificación de bajo costo.</li>
              <li>Constancia mensual por encima de la suerte.</li>
            </ul>
          </article>
        </div>

        <div className="section-head" style={{ marginTop: 'clamp(3.5rem, 7vw, 5.5rem)' }}>
          <p className="eyebrow">El método</p>
          <h3 className="h-section">El Método AL-HADIQA: 5 pasos reales hacia la libertad financiera</h3>
          <p>
            Un sistema simple que cualquier persona puede ejecutar, sin importar su salario ni su país. No reinventamos la rueda: la ponemos a girar en tu favor.
          </p>
        </div>

        <ol className="method">
          <li>
            <div>
              <strong>Toma el control de tus números</strong>
              <p>Durante 30 días registra cada ingreso y cada gasto. No puedes mejorar lo que no mides. Conocer tus números es el día 1 de tu libertad.</p>
            </div>
          </li>
          <li>
            <div>
              <strong>Ponte un presupuesto y págate primero</strong>
              <p>Aplica el 50/30/20: 50% necesidades, 30% gustos, 20% ahorro e inversión. Antes de pagar cualquier cosa, separa tu 10% mínimo de «págate a ti primero».</p>
            </div>
          </li>
          <li>
            <div>
              <strong>Blinda tu base: fondo de emergencia y cero deudas caras</strong>
              <p>Acumula de 3 a 6 meses de gastos en una cuenta separada y liquida primero las deudas con mayor interés (tarjetas, préstamos rápidos). Un castillo sin cimientos cae con el primer viento.</p>
            </div>
          </li>
          <li>
            <div>
              <strong>Invierte con constancia, no con suerte</strong>
              <p>Una vez blindada tu base, invierte cada mes de forma automática en fondos indexados del mercado global. El interés compuesto premia al constante: $100 mensuales al 8% anual se convierten en aprox. $149,000 en 30 años, habiendo aportado solo $36,000.</p>
            </div>
          </li>
          <li>
            <div>
              <strong>Multiplica tus fuentes de ingreso</strong>
              <p>Crea activos que paguen sin tu tiempo directo: un negocio con sistema, productos digitales, contenido o más inversiones. Así te mueves del lado izquierdo al lado derecho del cuadrante del flujo del dinero.</p>
            </div>
          </li>
        </ol>

        {/* Quadrant Quiz Component */}
        <QuadrantQuiz />

        {/* Free Library Component */}
        <LibrarySection />

        {/* Testimonials & Reviews Component */}
        <TestimonialsSection />

        <div className="disclaimer">
          ⚠️ <strong>Contenido con fines educativos. No es asesoría financiera.</strong> La inversión conlleva riesgo de pérdida de capital. Los resultados descritos son ilustrativos y dependen de la disciplina, el horizonte de tiempo y las condiciones del mercado. Nunca inviertas dinero que no estés dispuesto a mantener invertido a largo plazo.
        </div>
      </div>
    </section>
  );
};
