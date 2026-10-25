# ⚔️ Mazmorra Infinita - RPG de Supervivencia por Turnos (Estilo D&D)

**Mazmorra Infinita** es un RPG web de supervivencia infinita por salas y por turnos inspirado en las reglas clásicas de **Dungeons & Dragons (d20)**. Toda la lógica (dados, fórmulas de daño, Clase de Armadura, modificadores, estados alterados y progresión) está programada en código puro con TypeScript, sin dependencias de IA para simular reglas.

Desarrollado con **React 19**, **Vite**, **TypeScript**, **Tailwind CSS v4** y síntesis de audio procedural con la **Web Audio API**.

---

## 📋 Características Principales

- **Creación de Personaje en 4 Pasos**:
  - 5 Clases: *Guerrero*, *Clérigo*, *Pícaro*, *Mago*, *Explorador*.
  - Distribución del **Standard Array** (`15, 14, 13, 12, 10, 8`) con modificadores calculados en vivo y botón con sugerencia recomendada por clase.
  - 4 Conjuntos de equipo por clase con vista previa en vivo de la Clase de Armadura (CA) resultante y selección de habilidad especial inicial.
- **Exploración Modular de Salas**:
  - Salas de combate contra enemigos de Tier 1, 2 y 3.
  - Trampas con tiradas de salvación de Destreza (DEX) o Constitución (CON) contra CD.
  - Eventos de rol y decisión con pruebas de atributos y consecuencias.
  - Zonas seguras con cofres de botín, oro y pergaminos o tomos.
  - Encuentros con Jefes previos a cada campamento.
- **Combate por Turnos**:
  - Registro de combate detallado con desglose de dados: `[d20: 14 + 3 + 2 = 19 vs CA 13 → Éxito]`.
  - Impactos críticos con dados dobles, éxitos parciales (mitad de daño) y pifias.
  - Estados alterados: Envenenado, Aturdido, Dormido, Escudo de Fe, Marca del Cazador, Evasión Asombrosa.
- **Campamento, Tienda y Forja**:
  - Descansar (recupera vida y energía).
  - Guardar progreso: transfiere el **Oro de Expedición** a **Oro Seguro** y guarda la partida en `localStorage`.
  - Forja y Tienda: mejora de armas y armaduras (+1, +2, +3), compra de pociones y venta de botín.
- **Panel de Ficha e Inventario [I]**:
  - Estadísticas completas, gestión de habilidades (máximo 6) y mochila de objetos.
- **Efectos de Sonido Procedurales**:
  - Sintetizador Web Audio sin archivos externos pesados con botón de silenciar `[M]`.

---

## 🚀 Cómo Descargar el Proyecto y Subirlo a GitHub

Sigue estos pasos sencillos para descargar el código, probarlo en tu computadora y publicarlo en tu propio repositorio de GitHub.

### 1. Descargar el Proyecto desde AI Studio

1. En la esquina superior de la interfaz de **Google AI Studio**, busca el menú de opciones o el botón de **Descargar / Exportar código** (generalmente como archivo `.zip`).
2. Guarda el archivo `.zip` en tu computadora (por ejemplo, en tu carpeta de *Descargas* o *Proyectos*).
3. Descomprime el archivo `.zip` en una carpeta (ejemplo: `mazmorra-infinita`).

---

### 2. Requisitos Previos en tu Computadora

Asegúrate de tener instalados:
- **Node.js** (versión 18 o superior recomendada): [Descargar Node.js](https://nodejs.org/)
- **Git**: [Descargar Git](https://git-scm.com/)
- Un editor de código como **Visual Studio Code** (opcional pero recomendado): [Descargar VS Code](https://code.visualstudio.com/)

Para verificar que los tienes instalados, abre tu terminal o consola y ejecuta:
```bash
node -v
git --version
```

---

### 3. Instalar Dependencias y Ejecutar en Local

1. Abre tu terminal (en Windows: PowerShell o Git Bash; en Mac/Linux: Terminal).
2. Navega hasta la carpeta del proyecto descomprimido:
   ```bash
   cd ruta/a/tu/carpeta/mazmorra-infinita
   ```
3. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abre en tu navegador la dirección que aparece en la consola (habitualmente `http://localhost:3000` o `http://localhost:5173`). ¡El juego estará listo para jugar!

---

### 4. Subir el Repositorio a GitHub

#### Paso A: Crear el repositorio en GitHub
1. Inicia sesión en tu cuenta de [GitHub](https://github.com/).
2. Haz clic en el botón verde **"New"** o en el ícono **+** en la esquina superior derecha y selecciona **"New repository"**.
3. Asígnale un nombre a tu repositorio (por ejemplo, `mazmorra-infinita`).
4. Puedes elegir que sea **Público** o **Privado**.
5. **IMPORTANTE**: No marques las casillas de "Add a README file", ".gitignore" ni "License" (el proyecto ya los incluye).
6. Haz clic en **"Create repository"**.

#### Paso B: Vincular y subir desde tu terminal
En la misma carpeta del proyecto en tu terminal, ejecuta los siguientes comandos uno por uno:

```bash
# 1. Inicializar Git en la carpeta (si no está inicializado)
git init

# 2. Agregar todos los archivos al seguimiento de Git
git add .

# 3. Crear el primer commit
git commit -m "Initial commit - Juego Mazmorra Infinita"

# 4. Asegurarse de que la rama principal se llame main
git branch -M main

# 5. Conectar tu repositorio local con el repositorio remoto de GitHub
# (Reemplaza TU_USUARIO y TU_REPOSITORIO con tus datos reales de GitHub)
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# 6. Subir los archivos a GitHub
git push -u origin main
```

> **Nota si usas autenticación con contraseña**: GitHub ahora requiere un **Personal Access Token (PAT)** o clave SSH en lugar de tu contraseña habitual al hacer `git push`. Puedes generarlo en GitHub en *Settings > Developer Settings > Personal access tokens*.

---

### 5. Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo en local.
- `npm run build`: Compila el proyecto optimizado para producción en la carpeta `dist/`.
- `npm run lint`: Ejecuta el linter de TypeScript (`tsc --noEmit`) para comprobar que no haya errores de tipo.
- `npm test` o `npx tsx --test src/game/rules.test.ts`: Ejecuta la suite de pruebas unitarias de las reglas matemáticas y dados D&D.

---

### 6. Estructura del Código

```text
├── index.html                  # Plantilla HTML con fuentes medievales (Cinzel, MedievalSharp)
├── package.json                # Dependencias y scripts
├── vite.config.ts              # Configuración de Vite y Tailwind v4
├── src/
│   ├── main.tsx                # Entrada principal de React
│   ├── index.css               # Estilos globales y utilidades de fantasía oscura
│   ├── App.tsx                 # Máquina de estados principal y enrutador de pantallas
│   ├── components/
│   │   ├── TitleScreen.tsx     # Pantalla de título con emblema SVG y continuar partida
│   │   ├── CharacterCreation.tsx # Asistente de creación de héroe en 4 pasos
│   │   ├── DungeonHeader.tsx   # HUD con barras de vida, magia, XP, oro y salas
│   │   ├── RoomView.tsx        # Exploración de salas (combate, trampa, evento, cofre)
│   │   ├── CombatView.tsx      # Arena de combate por turnos con log d20
│   │   ├── CampView.tsx        # Campamento: descanso, guardado y tienda de mejoras
│   │   ├── DeathView.tsx       # Pantalla de muerte y resurrección
│   │   ├── InventoryModal.tsx  # Ficha de personaje, libro de habilidades y mochila
│   │   └── LevelUpModal.tsx    # Modal de subida de nivel y bonificaciones
│   ├── game/
│   │   ├── types.ts            # Tipos de TypeScript del juego
│   │   ├── rules.ts            # Motor de reglas puro D&D (dados, CA, HP, daño, log)
│   │   ├── rules.test.ts       # Pruebas unitarias con node:test
│   │   ├── data.ts             # Catálogo de clases, armas, enemigos y eventos
│   │   └── dungeon.ts          # Generador de salas y cálculo de botín
│   └── utils/
│       └── audio.ts            # Sintetizador procedural Web Audio (golpes, magias, dados)
```

---

## 🌐 Publicar el Juego en Internet (Opcional)

Si quieres compartir el juego con tus amigos, puedes desplegarlo gratuitamente en plataformas como **Vercel** o **Netlify**:
1. Conecta tu cuenta de GitHub a [Vercel](https://vercel.com/) o [Netlify](https://www.netlify.com/).
2. Selecciona el repositorio `mazmorra-infinita`.
3. El comando de build es `npm run build` y el directorio de salida es `dist`.
4. ¡En pocos segundos tendrás una URL pública para jugar desde cualquier celular o computadora!
