# AL-HADIQAINVEST — Ecosistema Digital & Holding Empresarial

Plataforma matriz centralizada para **AL-HADIQAINVEST**, un holding empresarial y ecosistema digital que unifica mercados financieros, consultoría tecnológica corporativa, entretenimiento gaming y educación financiera.

Reescrito y modernizado como una Single Page Application (SPA) en **React 18** con **Vite**, **TypeScript** y diseño modular de alto rendimiento.

---

## 🚀 Divisiones y Características Principales

## 👑 Comunidad, Roles & Autenticación (Google OAuth 2.0 & Firestore)

- **Botón Único "Continuar con Google"**: Inicio de sesión oficial con Google OAuth 2.0. Generación automática de perfil con foto, nombre y correo verificado.
- **Roles de Usuario (RBAC)**:
  - **Administrador (Sr.smith - Carlos Smith Zambrano González, CEO Fundador)**:
    - Verificado vía `empresaalhadiqainvest@gmail.com` y colección `/admins/`.
    - Panel Maestro completo de gestión: control de usuarios, asignación de roles (`admin`, `alumno`, `aprobador`), activación de estados (`active`, `pending`, `suspended`), edición de permisos granulares y expulsión.
    - Programación de clases en vivo y moderación directa del chat.
  - **Alumno**: Panel personal con acceso dinámico según los permisos que el administrador le active (Clases, Chat, Biblioteca, Al-Hadiqa Capital).
  - **Aprobador del Socio (JustMarkets)**: Rol para auditar, convalidar técnicamente y aprobar o devolver a borrador las clases antes de su publicación a la comunidad.
- **Clases en Vivo & Workshops Al-Hadiqa Live**:
  - Catálogo de sesiones en directo (SMC, Forex, Cripto, Psicología) con sala virtual interactiva y control de acceso.
- **Chat de Alumnos en Tiempo Real**:
  - Discusión de confluencias de mercado respaldado por Firestore en tiempo real con moderación para el administrador.

1. **Trading Institucional & Educación Financiera**
   - Resumen ejecutivo de la división financiera con botones de salto rápido hacia la plataforma integrada y web externa.
   - **Plataforma Completa Integrada (Clon Oficial):**
     - Hero con Smart Money Concepts (SMC), ejecución STP/ECN y gráfico SVG técnico interactivo (Order Block, FVG, CHoCH / Liq. Sweep, Target TP).
     - **Simulador Interactivo D3 de Análisis Técnico y Volatilidad:** Motor D3 en tiempo real que renderiza velas japonesas (OHLC), barras de volumen, capas algorítmicas de SMC (Order Blocks, FVG, Bandas dinámicas de volatilidad) y crosshair interactivo con selección de activos (XAU/USD, EUR/USD, BTC/USDT).
     - **Macroeconomía y Filtro por Activo:** Estrategias institucionales para Oro (XAUUSD), Divisas (EUR/USD) y Criptomonedas (BTC/Alts).
     - **Guía de SMC & Checklist Interactivo:** Trampas minoristas de Inducement, cálculo de Pips y ratio RRR, junto a un checklist operativo interactivo con contador en tiempo real.
     - **Horarios de Sesiones Globales en Vivo:** Monitoreo dinámico UTC con cálculo por minuto del estado de apertura/cierre de Sídney, Tokio, Londres y Nueva York.
     - **Condiciones ECN & Spreads:** Tabla comparativa de spreads desde 0.0 pips, comisiones y estadísticas de ejecución (<10ms NY4, apalancamiento 1:3000, 0% comisión de retiro).
     - **Biblioteca de Libros Especializados:** Descarga de material en PDF (*SMC Guía Definitiva*, *Psicología del Trading*, *Manual de Acción del Precio*).
     - **Asociación Oficial JustMarkets:** Parámetros de regulación multijurisdiccional, tipos de cuenta (Raw Spread/Pro) y enlaces de registro seguro intactos.
     - **Dinámica de Mercado:** Fuerzas del Toro 🐂 y del Oso 🐻 y advertencia legal obligatoria de riesgo CFD.

2. **Noticias & Catalizadores del Mercado Financiero (Live Market Feed)**
   - Feed interactivo de noticias financieras globales con simulación de peticiones API asíncronas y latencia de red.
   - Filtro por categorías macroeconómicas (Macro & FED, Oro & Commodities, Forex & Divisas, Criptomercados, Wall St & Índices).
   - Interpretación táctica e institucional de cada noticia con Smart Money Concepts (SMC) y gestión de riesgo.
   - Búsqueda en vivo por palabra clave o activo vinculado y botón de actualización en tiempo real con indicador de sincronización.
   - **Widget de Sentimiento de Mercado (MarketSentimentWidget con Recharts):**
     - Velocímetro/gauge semicircular del índice Fear & Greed (0-100) con clasificación por zonas.
     - Gráfico de radar multidimensional de 6 factores de sentimiento de mercado (VIX, Amplitud, Put/Call, Momentum, Bonos, Oro).
     - Diagnóstico táctico SMC para inversores y simulador de ticks en vivo.

3. **SMITHBUSINESS Solutions**
   - Arquitecturas de software escalables, automatización de procesos operativos y consultoría tecnológica empresarial.

3. **Taberna Lions-Gold (Gaming MMORPG)**
   - Comunidad gamer competitiva de Albion Online con gestión de economía interna, estrategias de gremio y colaboración.

4. **Infraestructura & Pilares del Ecosistema**
   - Soluciones de comercio electrónico (E-Commerce) multi-tienda.
   - Modelos de Inteligencia Artificial locales para toma de decisiones empresariales.
   - Gestión integral de comunidades digitales masivas.

5. **AL-HADIQA CAPITAL (Educación Financiera)**
   - Filosofía y método de 5 pasos para la libertad financiera.
   - Los 2 pilares: Finanzas personales (regla del 10%, presupuesto 50/30/20, fondo de emergencia) e Inversión básica (interés compuesto, fondos indexados).
   - **Herramienta interactiva:** Diagnóstico interactivo del Cuadrante del Flujo del Dinero (*Empleado, Autónomo, Dueño de negocio, Inversor*).
   - **Biblioteca gratuita:** Descarga directa de las guías en formato PDF (*7 Hábitos Financieros*, *Presupuesto 50/30/20*, *Cuadrante del Flujo del Dinero*).
   - **Comunidad y Testimonios:** Sistema reactivo de calificación por estrellas con almacenamiento local persistente (`localStorage`) y formulario de reseñas verificado.

6. **Preguntas Frecuentes (FAQ Accordion)**
   - Acordeón interactivo con accesibilidad completa (`aria-expanded`, `aria-controls`), etiquetas por temática y respuestas detalladas para inversores sobre el modelo del holding, sinergias y gestión de riesgo.

7. **Boletín Informativo (Newsletter Signup)**
   - Captura de correo electrónico responsiva con validación y tokens visuales de tarjetas.
   - Confirmación instantánea y persistencia de suscriptores en almacenamiento local (`localStorage`).

---

## 🛠️ Stack Tecnológico

- **React 18** (Functional Components & Hooks)
- **TypeScript** para tipado estático
- **Vite** para desarrollo y empaquetado optimizado
- **CSS Modular** con variables nativas de diseño, animaciones y soporte para modo reducido de movimiento
- **LocalStorage API** para persistencia de reseñas y comentarios en el navegador

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en puerto 3000
npm run dev

# Compilar para producción
npm run build
```

---

## 📄 Derechos y Licencia

Copyright © 2026 Smith Business Solutions / AL-HADIQAINVEST. Todos los derechos reservados.
