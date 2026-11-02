import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CAPITAL_MODULES } from '../data/capitalCurriculum';
import { CapitalModule, CapitalLessonItem, CapitalPillar } from '../types/capital';
import { executeCapitalDownload } from '../utils/libraryDownloader';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const AlHadiqaCapitalSection: React.FC = () => {
  const { currentUser, profile, isAdmin } = useAuth();

  const [activePillar, setActivePillar] = useState<CapitalPillar | 'all'>('all');
  const [selectedModule, setSelectedModule] = useState<CapitalModule | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CapitalLessonItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [currentNote, setCurrentNote] = useState<string>('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // Cashflow Simulator states
  const [showSimulator, setShowSimulator] = useState<boolean>(false);
  const [simActiveIncome, setSimActiveIncome] = useState<number>(1800);
  const [simPassiveIncome, setSimPassiveIncome] = useState<number>(350);
  const [simExpenses, setSimExpenses] = useState<number>(1400);
  const [simQuadrant, setSimQuadrant] = useState<'E' | 'A' | 'D' | 'I'>('E');

  // Load progress from Firestore or LocalStorage
  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      if (currentUser?.uid) {
        try {
          const docRef = doc(db, 'capital_progress', currentUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists() && isMounted) {
            const data = snap.data();
            setCompletedLessonIds(data.completedLessonIds || []);
            setNotes(data.notes || {});
            return;
          }
        } catch {
          // Fall back to local storage
        }
      }

      // Local storage fallback
      const saved = localStorage.getItem('al_hadiqa_capital_progress');
      if (saved && isMounted) {
        try {
          const parsed = JSON.parse(saved);
          setCompletedLessonIds(parsed.completedLessonIds || []);
          setNotes(parsed.notes || {});
        } catch {
          // Ignore json parse error
        }
      }
    }

    loadProgress();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Save progress helper
  const toggleLessonCompletion = async (lessonId: string) => {
    const isCompleted = completedLessonIds.includes(lessonId);
    const updated = isCompleted
      ? completedLessonIds.filter((id) => id !== lessonId)
      : [...completedLessonIds, lessonId];

    setCompletedLessonIds(updated);

    // Save to localStorage
    localStorage.setItem(
      'al_hadiqa_capital_progress',
      JSON.stringify({ completedLessonIds: updated, notes })
    );

    // Sync to Firestore if authenticated
    if (currentUser?.uid) {
      try {
        const docRef = doc(db, 'capital_progress', currentUser.uid);
        await setDoc(
          docRef,
          {
            userId: currentUser.uid,
            completedLessonIds: updated,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Error saving progress to Firestore:', err);
      }
    }

    setNotificationMsg({
      text: isCompleted ? 'Lección marcada como pendiente' : '¡Lección completada con éxito! 🎉',
      type: 'success',
    });
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Save lesson note
  const saveLessonNote = async (lessonId: string) => {
    const updatedNotes = { ...notes, [lessonId]: currentNote };
    setNotes(updatedNotes);

    localStorage.setItem(
      'al_hadiqa_capital_progress',
      JSON.stringify({ completedLessonIds, notes: updatedNotes })
    );

    if (currentUser?.uid) {
      try {
        const docRef = doc(db, 'capital_progress', currentUser.uid);
        await setDoc(
          docRef,
          {
            userId: currentUser.uid,
            notes: updatedNotes,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Error saving note:', err);
      }
    }

    setNotificationMsg({ text: 'Nota personal guardada correctamente', type: 'success' });
    setTimeout(() => setNotificationMsg(null), 2500);
  };

  // Permission evaluation for module
  const canAccessModule = (moduleId: string): boolean => {
    if (isAdmin) return true;
    if (!profile) return true; // public preview enabled for learning
    const assigned = profile.permissions?.assignedCapitalModuleIds;
    // If admin explicitly set assignedCapitalModuleIds array and it has items, check it
    if (assigned && assigned.length > 0) {
      return assigned.includes(moduleId);
    }
    // Default accessible if capital permission is active
    return profile.permissions?.canAccessCapital !== false;
  };

  // Permission evaluation for downloading
  const canDownloadMaterials = (): boolean => {
    if (isAdmin) return true;
    return Boolean(profile?.permissions?.canDownload);
  };

  // Handle module executive summary download
  const handleDownloadSummary = async (mod: CapitalModule) => {
    if (!currentUser) {
      setNotificationMsg({
        text: 'Inicia sesión con tu cuenta de alumno para descargar este recurso.',
        type: 'warning',
      });
      setTimeout(() => setNotificationMsg(null), 4000);
      return;
    }

    if (!canDownloadMaterials()) {
      setNotificationMsg({
        text: '🔒 Descarga restringida por el Administrador. Solo disponible con permiso de descarga activo.',
        type: 'warning',
      });
      setTimeout(() => setNotificationMsg(null), 4500);
      return;
    }

    setDownloadingId(mod.id);
    try {
      await executeCapitalDownload({
        moduleId: mod.id,
        moduleTitle: mod.title,
        pillarLabel: mod.pillarLabel,
        docTitle: mod.executiveSummary.title,
        filename: mod.executiveSummary.filename,
        coreThesis: mod.executiveSummary.coreThesis,
        actionChecklist: mod.executiveSummary.actionChecklist,
        principles: mod.executiveSummary.principles,
        userId: currentUser.uid,
        userName: profile?.displayName || currentUser.displayName || 'Estudiante Al-Hadiqa',
        userEmail: currentUser.email || 'estudiante@alhadiqainvest.com',
      });

      setNotificationMsg({
        text: `Descarga completada: ${mod.executiveSummary.title} (Registrado en auditoría).`,
        type: 'success',
      });
      setTimeout(() => setNotificationMsg(null), 4000);
    } catch {
      setNotificationMsg({
        text: 'Error al procesar la descarga. Intente nuevamente.',
        type: 'warning',
      });
      setTimeout(() => setNotificationMsg(null), 4000);
    } finally {
      setDownloadingId(null);
    }
  };

  // Request download access helper
  const handleRequestAccess = async (itemTitle: string) => {
    if (!currentUser) {
      setNotificationMsg({ text: 'Inicia sesión para enviar una solicitud al administrador.', type: 'info' });
      setTimeout(() => setNotificationMsg(null), 3500);
      return;
    }

    try {
      await addDoc(collection(db, 'notifications'), {
        title: 'Solicitud de Acceso a Capital / Descarga',
        message: `El alumno ${profile?.displayName || currentUser.email} solicita habilitación de descarga para: ${itemTitle}.`,
        targetRole: 'admin',
        type: 'urgent',
        createdAt: serverTimestamp(),
      });
      setNotificationMsg({
        text: '✓ Solicitud enviada al Administrador. Recibirás respuesta en el aula virtual.',
        type: 'success',
      });
      setTimeout(() => setNotificationMsg(null), 4000);
    } catch {
      setNotificationMsg({ text: 'Solicitud registrada localmente.', type: 'info' });
      setTimeout(() => setNotificationMsg(null), 3000);
    }
  };

  // Filter modules
  const filteredModules =
    activePillar === 'all'
      ? CAPITAL_MODULES
      : CAPITAL_MODULES.filter((m) => m.pillar === activePillar);

  // Overall progress metrics
  const totalLessons = CAPITAL_MODULES.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = completedLessonIds.length;
  const overallPercentage = Math.min(100, Math.round((completedCount / (totalLessons || 1)) * 100));

  // Open lesson viewer modal
  const openLesson = (mod: CapitalModule, les: CapitalLessonItem) => {
    setSelectedModule(mod);
    setSelectedLesson(les);
    setCurrentNote(notes[les.id] || '');
    setIsViewerOpen(true);
  };

  // Simulator calculations
  const totalIncome = Number(simActiveIncome) + Number(simPassiveIncome);
  const freeCashflow = totalIncome - Number(simExpenses);
  const emancipationRatio =
    simExpenses > 0 ? Math.min(200, Math.round((Number(simPassiveIncome) / Number(simExpenses)) * 100)) : 0;

  return (
    <div className="capital-hub" style={{ marginTop: '3.5rem' }}>
      {/* Toast Notification */}
      {notificationMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 9999,
            padding: '1rem 1.4rem',
            borderRadius: '10px',
            background:
              notificationMsg.type === 'success'
                ? 'rgba(16, 185, 129, 0.95)'
                : notificationMsg.type === 'warning'
                ? 'rgba(239, 68, 68, 0.95)'
                : 'rgba(59, 130, 246, 0.95)',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(10px)',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <span>{notificationMsg.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(20, 28, 48, 0.95), rgba(11, 17, 32, 0.98))',
          border: '1px solid var(--gold)',
          borderRadius: 'var(--radius)',
          padding: 'clamp(1.5rem, 3vw, 2.5rem)',
          boxShadow: '0 20px 40px -10px rgba(245, 158, 11, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '2.5rem',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ maxWidth: '750px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
              <span
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--gold)',
                  border: '1px solid var(--gold)',
                  borderRadius: '999px',
                  padding: '0.2rem 0.8rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Academia Exclusiva de Alto Impacto
              </span>
              <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>4 Módulos · Clases · Lecturas · Resúmenes</span>
            </div>
            <h3 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.1rem)', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.8rem' }}>
              AL-HADIQA <span style={{ color: 'var(--gold)' }}>CAPITAL</span>: Educación Financiera &amp; Desarrollo Personal
            </h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0, fontSize: '0.96rem' }}>
              Formación integral para dominar el cuadrante del flujo del dinero de Robert Kiyosaki, los principios atemporales de los
              grandes inversores (Buffett, Dalio, Graham, Munger, Lynch), presencia y hábitos atómicos del inversor, y psicotrading con
              psicología en los negocios.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '1rem 1.4rem',
              minWidth: '220px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Tu Progreso en Capital:</span>
              <strong style={{ color: 'var(--emerald)', fontSize: '1.1rem' }}>{overallPercentage}%</strong>
            </div>
            <div style={{ background: 'var(--surface)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${overallPercentage}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--gold), var(--emerald))',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)' }}>
              <span>{completedCount} de {totalLessons} lecciones</span>
              <span>{overallPercentage === 100 ? '🏆 Certificado Listo' : 'En Curso'}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowSimulator(!showSimulator)}
              style={{
                marginTop: '0.3rem',
                background: showSimulator ? 'var(--gold)' : 'rgba(245, 158, 11, 0.1)',
                color: showSimulator ? '#07111f' : 'var(--gold)',
                border: '1px solid var(--gold)',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              {showSimulator ? '✕ Ocultar Simulador' : '🧮 Simulador de Flujo'}
            </button>
          </div>
        </div>
      </div>

      {/* Cashflow & Quadrant Interactive Simulator */}
      {showSimulator && (
        <div
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--gold)',
            borderRadius: 'var(--radius)',
            padding: '1.5rem',
            marginBottom: '2rem',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🧮</span> Simulador y Calculadora del Cuadrante del Flujo de Dinero (Kiyosaki)
            </h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Herramienta Práctica de Autodiagnóstico</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {/* Input Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.3rem' }}>
                  Cuadrante actual predominante:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                  {(['E', 'A', 'D', 'I'] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setSimQuadrant(q)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: simQuadrant === q ? '2px solid var(--gold)' : '1px solid var(--line)',
                        background: simQuadrant === q ? 'rgba(245, 158, 11, 0.2)' : 'var(--surface)',
                        color: simQuadrant === q ? 'var(--gold)' : 'var(--text)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.3rem' }}>
                  Ingreso Activo Mensual (Salario / Facturación manual en $):
                </label>
                <input
                  type="number"
                  value={simActiveIncome}
                  onChange={(e) => setSimActiveIncome(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.9rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.3rem' }}>
                  Flujo de Caja Pasivo Mensual (Rentas, Dividendos, Trading en $):
                </label>
                <input
                  type="number"
                  value={simPassiveIncome}
                  onChange={(e) => setSimPassiveIncome(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.9rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    color: 'var(--emerald)',
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.3rem' }}>
                  Gastos Fijos Vitales Mensuales (Vivienda, Comida, Deudas en $):
                </label>
                <input
                  type="number"
                  value={simExpenses}
                  onChange={(e) => setSimExpenses(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.9rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    color: 'var(--text)',
                  }}
                />
              </div>
            </div>

            {/* Diagnostics Column */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '1.2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Resultado del Diagnóstico:
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', margin: '0.6rem 0' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 800, color: emancipationRatio >= 100 ? 'var(--emerald)' : 'var(--gold)' }}>
                    {emancipationRatio}%
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>de Emancipación Financiera</span>
                </div>

                <div style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text)', marginBottom: '1rem' }}>
                  {emancipationRatio >= 100 ? (
                    <span style={{ color: 'var(--emerald)' }}>
                      🎉 <strong>¡Libertad Financiera Alcanzada!</strong> Tus ingresos pasivos cubren el 100% de tus gastos vitales. Tu tiempo es tuyo.
                    </span>
                  ) : (
                    <span>
                      Necesitas <strong>${Math.max(0, simExpenses - simPassiveIncome).toLocaleString()} USD adicionales</strong> en ingresos pasivos mensuales para emanciparte por completo de la Carrera de la Rata.
                    </span>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--line)', paddingTop: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Cashflow Libre Mensual:</span>
                    <strong style={{ color: freeCashflow >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                      ${freeCashflow.toLocaleString()} USD
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Estrategia recomendada:</span>
                    <strong style={{ color: 'var(--gold)' }}>
                      {simQuadrant === 'E' || simQuadrant === 'A'
                        ? 'Puente E/A -> Adquirir Activos en I'
                        : 'Escalar Sistemas y Delegación en D/I'}
                    </strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  padding: '0.8rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  fontSize: '0.8rem',
                  color: 'var(--muted)',
                  marginTop: '1rem',
                }}
              >
                💡 <em>Aplica el Módulo 1 para aprender la ingeniería de flujo de caja y adquirir tu primer activo productor en 90 días.</em>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pillar Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.6rem',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--line)',
          paddingBottom: '1rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActivePillar('all')}
          className={`quiz__btn ${activePillar === 'all' ? 'active' : ''}`}
          style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem', borderRadius: '8px' }}
        >
          🌐 Todos los Módulos ({CAPITAL_MODULES.length})
        </button>
        <button
          type="button"
          onClick={() => setActivePillar('educacion_financiera')}
          className={`quiz__btn ${activePillar === 'educacion_financiera' ? 'active' : ''}`}
          style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem', borderRadius: '8px' }}
        >
          🧭 Educación Financiera (Kiyosaki &amp; Titanes)
        </button>
        <button
          type="button"
          onClick={() => setActivePillar('desarrollo_personal')}
          className={`quiz__btn ${activePillar === 'desarrollo_personal' ? 'active' : ''}`}
          style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem', borderRadius: '8px' }}
        >
          👑 Desarrollo Personal (Presencia &amp; Hábitos)
        </button>
        <button
          type="button"
          onClick={() => setActivePillar('psicotrading_negocios')}
          className={`quiz__btn ${activePillar === 'psicotrading_negocios' ? 'active' : ''}`}
          style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem', borderRadius: '8px' }}
        >
          ⚖️ Psicotrading &amp; Negocios
        </button>
      </div>

      {/* Modules Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.8rem' }}>
        {filteredModules.map((mod) => {
          const isAllowed = canAccessModule(mod.id);
          const modCompletedLessons = mod.lessons.filter((l) => completedLessonIds.includes(l.id));
          const modProgress = Math.round((modCompletedLessons.length / mod.lessons.length) * 100);
          const isFullyCompleted = modProgress === 100;

          return (
            <div
              key={mod.id}
              style={{
                background: 'linear-gradient(170deg, var(--surface-2), var(--surface))',
                border: isFullyCompleted ? '1px solid var(--emerald)' : '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isFullyCompleted ? '0 10px 25px -5px rgba(16, 185, 129, 0.2)' : 'var(--shadow)',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
                position: 'relative',
              }}
            >
              {/* Badge & Pillar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: mod.colorVar,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {mod.pillarLabel}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {isFullyCompleted && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        ✓ Completado
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>⏱️ {mod.estimatedHours}</span>
                  </div>
                </div>

                {/* Module Title */}
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{mod.icon}</span>
                  <span>{mod.title}</span>
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 500, margin: '0 0 0.8rem' }}>
                  {mod.subtitle}
                </p>
                <p style={{ fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 1.2rem' }}>
                  {mod.description}
                </p>

                {/* Progress Bar */}
                <div style={{ marginBottom: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem', color: 'var(--muted)' }}>
                    <span>Progreso: {modCompletedLessons.length}/{mod.lessons.length} lecciones</span>
                    <strong style={{ color: isFullyCompleted ? 'var(--emerald)' : 'var(--text)' }}>{modProgress}%</strong>
                  </div>
                  <div style={{ background: 'var(--surface-3)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${modProgress}%`,
                        height: '100%',
                        background: isFullyCompleted ? 'var(--emerald)' : 'var(--gold)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Syllabus Preview List */}
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: '0.8rem', marginBottom: '1.2rem' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, display: 'block', marginBottom: '0.6rem' }}>
                    Contenido Incluido (Clases, Lecturas &amp; Resúmenes):
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {mod.lessons.map((les) => {
                      const isLesCompleted = completedLessonIds.includes(les.id);
                      return (
                        <div
                          key={les.id}
                          onClick={() => isAllowed && openLesson(mod, les)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.45rem 0.6rem',
                            background: isLesCompleted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.03)',
                            borderRadius: '6px',
                            cursor: isAllowed ? 'pointer' : 'not-allowed',
                            fontSize: '0.8rem',
                            border: '1px solid rgba(255,255,255,0.04)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                            <span>{les.type === 'clase' ? '📺' : les.type === 'lectura' ? '📖' : '📋'}</span>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isLesCompleted ? 'var(--text)' : 'var(--muted)' }}>
                              {les.title}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: isLesCompleted ? 'var(--emerald)' : 'var(--muted)',
                              fontWeight: 600,
                            }}
                          >
                            {isLesCompleted ? '✓' : `${les.durationMinutes}m`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={() => isAllowed && openLesson(mod, mod.lessons[0])}
                    disabled={!isAllowed}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      borderRadius: '6px',
                      background: isAllowed ? 'var(--emerald)' : 'rgba(255,255,255,0.05)',
                      color: isAllowed ? '#07111f' : 'var(--muted)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      border: 'none',
                      cursor: isAllowed ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    {isAllowed ? '▶ Iniciar / Continuar' : '🔒 Requiere Asignación'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadSummary(mod)}
                    disabled={downloadingId === mod.id}
                    title="Descargar Síntesis Maestra en PDF"
                    style={{
                      padding: '0.6rem 0.9rem',
                      borderRadius: '6px',
                      background: canDownloadMaterials() ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)',
                      color: canDownloadMaterials() ? 'var(--gold)' : 'var(--muted)',
                      border: canDownloadMaterials() ? '1px solid var(--gold)' : '1px solid var(--line)',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: canDownloadMaterials() ? 'pointer' : 'help',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    {downloadingId === mod.id ? '⏳...' : canDownloadMaterials() ? '📥 Síntesis PDF' : '🔒 PDF'}
                  </button>
                </div>

                {/* If download is locked, offer request button */}
                {!canDownloadMaterials() && (
                  <button
                    type="button"
                    onClick={() => handleRequestAccess(`Descarga Síntesis de ${mod.title}`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      fontSize: '0.72rem',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    🔒 Descarga bloqueada · Solicitar habilitación al Administrador
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Lesson Reader / Player Modal */}
      {isViewerOpen && selectedModule && selectedLesson && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(7, 11, 20, 0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(1rem, 2vw, 2.5rem)',
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: 'linear-gradient(165deg, var(--surface-2), var(--surface))',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              width: '100%',
              maxWidth: '920px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.2rem 1.6rem',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.9)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.75rem', color: selectedModule.colorVar, fontWeight: 700, textTransform: 'uppercase' }}>
                    {selectedModule.pillarLabel} · {selectedModule.title}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      background: 'var(--surface)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      color: 'var(--muted)',
                    }}
                  >
                    {selectedLesson.type.toUpperCase()} · {selectedLesson.durationMinutes} min
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text)', margin: 0, fontWeight: 800 }}>
                  {selectedLesson.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsViewerOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--line)',
                  color: 'var(--text)',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: '1.6rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* If Clase: Video simulator banner */}
              {selectedLesson.type === 'clase' && (
                <div
                  style={{
                    background: '#040812',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    position: 'relative',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎬</div>
                  <h4 style={{ margin: '0 0 0.4rem', color: 'var(--text)' }}>
                    Reproductor Masterclass Institucional
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0 auto 1.2rem', maxWidth: '520px' }}>
                    Instructor: <strong>{selectedLesson.instructorOrAuthor}</strong> · Duración completa: {selectedLesson.durationMinutes} minutos.
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald)', border: '1px solid var(--emerald)', padding: '0.5rem 1.2rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 }}>
                    <span>▶ Audio &amp; Video Formativo Sincronizado</span>
                  </div>
                </div>
              )}

              {/* Summary and Key Takeaways */}
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '8px',
                  padding: '1.2rem',
                }}
              >
                <h5 style={{ margin: '0 0 0.5rem', color: 'var(--gold)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🎯</span> Puntos Clave &amp; Objetivos de Aprendizaje
                </h5>
                <p style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.5, margin: '0 0 0.8rem' }}>
                  {selectedLesson.summary}
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.84rem', color: 'var(--muted)' }}>
                  {selectedLesson.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx}>
                      <strong style={{ color: 'var(--text)' }}>{takeaway}</strong>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Reading Content Markdown / Text */}
              {selectedLesson.readingContentMarkdown && (
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    lineHeight: 1.7,
                    fontSize: '0.92rem',
                    color: 'var(--text)',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {selectedLesson.readingContentMarkdown}
                </div>
              )}

              {/* Personal Notes Section */}
              <div
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '1.2rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>📝</span> Mis Notas y Conclusiones de Aprendizaje:
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Guardadas en tu perfil</span>
                </div>
                <textarea
                  rows={3}
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Anota aquí tus compromisos, ideas de inversión o reglas de trading aprendidas..."
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '6px',
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                    marginBottom: '0.5rem',
                  }}
                />
                <button
                  type="button"
                  onClick={() => saveLessonNote(selectedLesson.id)}
                  style={{
                    padding: '0.4rem 0.9rem',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--line)',
                    borderRadius: '4px',
                    color: 'var(--text)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  Guardar Nota
                </button>
              </div>

              {/* JustMarkets Legal Disclaimer within class reader */}
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--muted)',
                  borderTop: '1px solid var(--line)',
                  paddingTop: '0.8rem',
                  fontStyle: 'italic',
                }}
              >
                ⚠️ <strong>Aviso Legal JustMarkets:</strong> Las clases, lecturas y materiales de Al-Hadiqa Capital son impartidos por un socio y no por el bróker. Contenido con fines educativos y de desarrollo personal, no constituye asesoría financiera ni recomendación de inversión.
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div
              style={{
                padding: '1rem 1.6rem',
                borderTop: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.8rem',
                background: 'rgba(15, 23, 42, 0.95)',
              }}
            >
              <button
                type="button"
                onClick={() => toggleLessonCompletion(selectedLesson.id)}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '6px',
                  background: completedLessonIds.includes(selectedLesson.id) ? 'rgba(16, 185, 129, 0.2)' : 'var(--emerald)',
                  color: completedLessonIds.includes(selectedLesson.id) ? 'var(--emerald)' : '#07111f',
                  border: completedLessonIds.includes(selectedLesson.id) ? '1px solid var(--emerald)' : 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {completedLessonIds.includes(selectedLesson.id) ? '✓ Lección Completada (Clic para desmarcar)' : 'Marcar como Completada ✓'}
              </button>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => handleDownloadSummary(selectedModule)}
                  disabled={downloadingId === selectedModule.id}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '6px',
                    background: canDownloadMaterials() ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.06)',
                    color: canDownloadMaterials() ? 'var(--gold)' : 'var(--muted)',
                    border: canDownloadMaterials() ? '1px solid var(--gold)' : '1px solid var(--line)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: canDownloadMaterials() ? 'pointer' : 'help',
                  }}
                >
                  {downloadingId === selectedModule.id ? 'Descargando...' : canDownloadMaterials() ? '📥 Descargar Síntesis PDF' : '🔒 Descarga Restringida'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsViewerOpen(false)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.08)',
                    color: 'var(--text)',
                    border: '1px solid var(--line)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
