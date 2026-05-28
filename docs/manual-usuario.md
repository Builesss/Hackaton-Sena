# 📖 Manual de Usuario — Medellín Movilidata OS

**Versión:** 1.0.0  
**Fecha:** Mayo 2026  
**Proyecto:** HackData CTGI SENA 2026  
**Público Objetivo:** Operadores de tránsito, tomadores de decisiones municipales y ciudadanos de Medellín.

---

## 1. Introducción
**Medellín Movilidata OS** es un Sistema Operativo de Movilidad Urbana Inteligente unificado que permite monitorear, predecir e intervenir en el flujo vehicular y la seguridad vial del Valle de Aburrá. 

Integrando tecnologías de Progressive Web Apps (PWA), mapas interactivos (Leaflet), modelos predictivos de Inteligencia Artificial (ML/LLM) y datos climatológicos en tiempo real, la plataforma funciona de forma fluida tanto en computadoras de escritorio como en teléfonos móviles, incluso con conexión intermitente.

---

## 2. Acceso e Instalación

### Acceso Web y Móvil
*   **Enlace local de desarrollo:** `http://localhost:5173/`
*   La interfaz es **100% responsiva** y se adapta automáticamente a pantallas de celulares, tablets y monitores de centros de control.

### Instalación como Aplicación (PWA)
Al ser una Progressive Web App (PWA), puedes instalarla directamente en tu dispositivo sin pasar por una tienda de aplicaciones:
*   **En Android (Chrome):** Presiona el banner "Agregar a la pantalla principal" o haz clic en los tres puntos de la esquina superior derecha y selecciona **Instalar aplicación**.
*   **En iOS (Safari):** Presiona el botón de **Compartir** (icono de la caja con flecha hacia arriba) y selecciona **Agregar a inicio**.
*   **En PC (Chrome/Edge):** Haz clic en el icono de instalación que aparece a la derecha de la barra de direcciones del navegador.

> [!NOTE]
> Una vez instalada, la app funcionará a pantalla completa como una aplicación nativa y tendrá soporte offline parcial gracias a su Service Worker.

---

## 3. Módulos del Sistema

Navega entre los módulos usando la barra lateral (**Sidebar**) en computadoras de escritorio, o a través del botón de menú hamburguesa en la parte superior izquierda en dispositivos móviles.

### 3.1. 🏙️ Dashboard Central
Es la pantalla de inicio del sistema. Proporciona una vista aérea rápida del estado actual de la ciudad:
*   **Tarjetas de KPIs:** Monitorea de un vistazo el total de accidentes acumulados, el porcentaje promedio de congestión general, las precipitaciones en milímetros (mm) y el número de alertas climáticas activas.
*   **Accesos Rápidos:** Botones interactivos que muestran el estado en vivo (LIVE) y redirigen a los módulos correspondientes.
*   **Zonas Críticas Ahora:** Tabla interactiva que ordena las vías con mayor congestión en tiempo real.
*   **Alertas y Notificaciones:** Un panel de notificaciones dinámicas que consolida reportes de lluvia del SIATA, congestiones de vías críticas y predicciones de los modelos de IA.

---

### 3.2. ⚠️ Zonas Críticas de Accidentalidad
Módulo especializado en el análisis de puntos calientes (Blackspots) de siniestros viales:
*   **Mapa de Incidentes Viales:** Un mapa interactivo que renderiza círculos de colores de acuerdo a la gravedad de los accidentes:
    *   🔴 **Fatal** (Rojo)
    *   🟠 **Grave** (Naranja)
    *   🟡 **Leve** (Amarillo)
    *   *Nota: El radio del círculo es proporcional a la cantidad de víctimas del incidente.*
*   **Filtros Rápidos:** En la esquina superior derecha del mapa, puedes filtrar los incidentes haciendo clic en **Todos**, **Fatal**, **Grave** o **Leve**.
*   **Detalle del Incidente:** Haz clic sobre cualquier punto en el mapa para abrir un globo interactivo (Popup) con información detallada de la vía, fecha, hora exacta, número de víctimas y si había lluvia activa en ese momento.
*   **Índice de Riesgo por Zona:** Panel derecho que evalúa en una escala del 0% al 100% el nivel de riesgo geográfico de las comunas y sectores de Medellín utilizando algoritmos de Machine Learning históricos.
*   **Estadísticas Gráficas:** Al final del módulo, encontrarás gráficos de barras con el histórico mensual de accidentes frente a víctimas, y un gráfico de dona con la distribución porcentual de los tipos de accidentes (Choque, Atropello, Volcamiento, Caída de ocupante, Otro).

---

### 3.3. 🚦 Tráfico en Tiempo Real
Permite rastrear el flujo vehicular de las arterias principales de Medellín con actualizaciones simuladas en vivo cada 5 segundos:
*   **Indicadores Clave:** Muestra el promedio de congestión, velocidad promedio general en la ciudad (km/h) y el flujo total acumulado de vehículos por hora.
*   **Mapa de Tráfico en Vivo:** Los marcadores se pintan dinámicamente según el nivel de tráfico:
    *   🔴 **Crítico** (≥90% congestión)
    *   🟠 **Alto** (≥80% congestión)
    *   🟡 **Moderado** (≥65% congestión)
    *   🟢 **Normal** (<65% congestión)
*   **Tabla de Estado por Vía:** Panel derecho detallado que lista las velocidades reales y cantidad de vehículos/hora.
*   **Patrón de Congestión Histórico por Hora:** Gráfica de líneas interactiva que te permite seleccionar el día de la semana (Lunes a Domingo) para analizar el comportamiento histórico de la congestión y planificar horas pico.

---

### 3.4. 🧠 Predicción de Congestión IA
Usa modelos avanzados de Machine Learning e Inteligencia Artificial para anticiparse a la congestión vial con un horizonte de 2 a 4 horas:
*   **Botón "Ejecutar Predicción IA":** Activa el procesamiento del agente inteligente. Al presionarlo, se iniciará la simulación del modelo predictivo.
*   **Consola del Agente LLM (Terminal):** Muestra el log de pasos técnicos que realiza el modelo en tiempo real (Carga de datos históricos, preprocesamiento con Pandas, análisis ARIMA, corrección con XGBoost y cálculo de confianza).
*   **Gráfica Comparativa Histórico vs Predicción IA:** Una vez finalizada la simulación, se dibuja una línea continua verde que proyecta la congestión esperada para el resto del día frente a la línea discontinua morada del histórico típico.
*   **Heatmap Predictivo por Zona:** Tarjetas de riesgo predictivo que evalúan el porcentaje de probabilidad de que una vía colapse en las próximas 4 horas, especificando la franja horaria crítica proyectada.

---

### 3.5. 🌧️ Rutas Seguras en Temporada de Lluvias
Módulo de resiliencia climática que cruza datos hidrometeorológicos con riesgos de inundaciones y deslizamientos:
*   **Métricas de Clima SIATA:** Muestra datos actualizados de lluvia (mm), velocidad del viento, temperatura, humedad y alertas vigentes.
*   **Mapa de Riesgo Climático:** Renderiza polígonos y puntos calientes de inundación activa o riesgo de deslizamiento. Si una alerta climática está activa, los puntos calientes se iluminarán en rojo intenso.
*   **Rutas Recomendadas:** Evalúa de forma inteligente las vías de escape seguras:
    *   🟢 **Recomendada:** Vía rápida, segura y libre de riesgos hidrológicos.
    *   🔵 **Disponible:** Vía transitable pero con congestión moderada.
    *   🔴 **Bloqueada:** Vía cerrada debido a inundaciones activas o caídas de árboles.
*   **Gráficos de Correlación:** Muestra la correlación estadística directa anual entre el volumen de precipitación (en milímetros) y el aumento de accidentes viales en Medellín.
*   **Pronóstico a Corto Plazo:** Muestra la proyección de precipitación para las próximas horas a fin de tomar decisiones preventivas de desvíos antes de salir.

---

## 4. Preguntas Frecuentes e Incidentes Comunes

#### ¿Cómo sé si los datos están actualizados?
En el Dashboard y en el módulo de Tráfico en Tiempo Real verás el indicador parpadeante verde `LIVE`. Los datos vehiculares se actualizan automáticamente en el fondo cada 5 segundos.

#### ¿El sistema funciona sin internet?
Sí, de forma parcial. Gracias a la tecnología PWA, el caparazón de la aplicación y la última información descargada quedan guardados en la memoria caché del navegador de tu dispositivo. Podrás abrir la app y navegar por las vistas aunque pierdas la señal de red.

#### El mapa no carga correctamente en móvil.
Asegúrate de conceder permisos de red a la aplicación. En ocasiones, la primera carga de mapas requiere descargar las teselas de OpenStreetMap. Una vez descargadas, el rendimiento mejora exponencialmente.
