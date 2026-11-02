import React, { useState } from 'react';

interface FaqItemData {
  id: string;
  category: string;
  question: string;
  answer: React.ReactNode;
}

const FAQS: FaqItemData[] = [
  {
    id: 'holding-overview',
    category: 'Ecosistema & Modelo',
    question: '¿Qué es AL-HADIQAINVEST y cuál es su propuesta como holding empresarial?',
    answer: (
      <>
        <p>
          AL-HADIQAINVEST es un holding empresarial matriz concebido para integrar cuatro divisiones comerciales estratégicas:
          mercados financieros y trading institucional, ingeniería de software corporativa (SmithBusiness Solutions),
          economía de comunidades gaming (Taberna Lions-Gold) y formación para la independencia financiera (AL-HADIQA CAPITAL).
        </p>
        <p>
          Este modelo multifacético reduce la dependencia de una sola fuente de ingresos y aprovecha sinergias tecnológicas y financieras
          para construir un ecosistema resiliente y de alto valor.
        </p>
      </>
    ),
  },
  {
    id: 'risk-management',
    category: 'Riesgo & Capital',
    question: '¿Cuál es la política de gestión de riesgo y preservación de capital?',
    answer: (
      <>
        <p>
          La preservación de capital es la primera regla del holding. En la división de trading, cada operación se rige por un ratio de
          riesgo/beneficio estricto y límites de apalancamiento controlados.
        </p>
        <p>
          En el plano patrimonial y educativo de AL-HADIQA CAPITAL, se prioriza blindar la base financiera mediante fondos de emergencia
          de 3 a 6 meses de gastos y la colocación pasiva en índices globales con diversificación geográfica e interés compuesto a largo plazo.
        </p>
      </>
    ),
  },
  {
    id: 'divisions-difference',
    category: 'Divisiones Financieras',
    question: '¿Cuál es la diferencia entre Trading Institucional y AL-HADIQA CAPITAL?',
    answer: (
      <>
        <p>
          <strong>Trading Institucional</strong> se enfoca en el análisis técnico avanzado, lectura de liquidez institucional,
          estrategias intradiarias/swing y ejecución profesional en mercados globales de divisas, materias primas e índices.
        </p>
        <p>
          <strong>AL-HADIQA CAPITAL</strong> es el pilar de educación financiera personal y patrimonial: enseña el método de los 5 pasos,
          la regla del 10% (&laquo;págate a ti primero&raquo;), presupuestación 50/30/20 y transición desde ingresos activos hacia pasivos
          en el cuadrante del flujo del dinero.
        </p>
      </>
    ),
  },
  {
    id: 'entry-requirements',
    category: 'Acceso & Requisitos',
    question: '¿Qué requisitos o capital inicial se necesitan para participar?',
    answer: (
      <>
        <p>
          El acceso a la biblioteca de libros formativos (en PDF), el diagnóstico interactivo del cuadrante y los contenidos educativos
          de AL-HADIQA CAPITAL es completamente libre y gratuito.
        </p>
        <p>
          Para los programas de formación avanzada en Trading o los servicios de ingeniería de SmithBusiness Solutions, existen procesos de
          admisión y planes estructurados según el perfil y nivel de experiencia del participante o empresa.
        </p>
      </>
    ),
  },
  {
    id: 'guarantees-transparency',
    category: 'Transparencia & Rentabilidad',
    question: '¿AL-HADIQAINVEST ofrece retornos fijos garantizados o promesas de riqueza rápida?',
    answer: (
      <>
        <p>
          <strong>No.</strong> En AL-HADIQAINVEST operamos con total transparencia: no creemos en atajos ni en promesas de riqueza
          fácil. Toda inversión en mercados conlleva riesgos de volatilidad y pérdida de capital.
        </p>
        <p>
          Nuestra filosofía se basa en la constancia, la disciplina y el rigor estratégico:
          <em> &laquo;Los hombres luchan y Dios concede la victoria.&raquo;</em> Tú aportas el esfuerzo diario y la ejecución metódica;
          los resultados sostenibles llegan con el tiempo.
        </p>
      </>
    ),
  },
  {
    id: 'enterprise-synergy',
    category: 'Tecnología & Expansión',
    question: '¿Cómo complementa SmithBusiness Solutions al resto del holding?',
    answer: (
      <>
        <p>
          SmithBusiness Solutions provee la espina dorsal tecnológica del holding: desarrollo de plataformas web corporativas,
          automatizaciones con IA local, arquitectura de software escalable y plataformas e-commerce con pasarelas integradas.
        </p>
        <p>
          Esta capacidad de ingeniería propia garantiza que todas las unidades del grupo operen con tecnología propia y sin depender
          de proveedores externos costosos o vulnerables.
        </p>
      </>
    ),
  },
];

export const FaqSection: React.FC = () => {
  // Allow toggling items, default the first item to open
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'holding-overview': true,
  });

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section className="section" id="faq" aria-labelledby="faq-heading">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Preguntas Frecuentes · Inversores</p>
          <h2 className="h-section" id="faq-heading">
            Respuestas Claras para <span className="gradient-text">Inversores &amp; Comunidad</span>
          </h2>
          <p>
            Conoce a fondo nuestra visión, arquitectura de negocio, políticas de riesgo y cómo puedes beneficiarte de nuestro ecosistema.
          </p>
        </div>

        <div className="faq-list">
          {FAQS.map(item => {
            const isOpen = !!openItems[item.id];
            return (
              <div
                key={item.id}
                className={`faq-item ${isOpen ? 'is-open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-trigger"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                  id={`faq-trigger-${item.id}`}
                >
                  <div>
                    <span className="faq-tag">{item.category}</span>
                    <div>{item.question}</div>
                  </div>
                  <span className="faq-icon-wrap" aria-hidden="true">
                    +
                  </span>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${item.id}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${item.id}`}
                    className="faq-answer"
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
