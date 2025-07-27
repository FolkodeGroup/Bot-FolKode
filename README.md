# 🤖 FolKode Group AI Assistant

Asistente de IA interactivo construido con React, TypeScript y Google Gemini AI. Una aplicación web moderna que proporciona asistencia inteligente multiidioma con interfaz conversacional.

## 🚀 Instalación Rápida

### Prerequisitos
- **Node.js** >= 18.0.0 ([Descargar aquí](https://nodejs.org/))
- **NPM** >= 8.0.0 (incluido con Node.js)
- **Clave API de Google Gemini** ([Obtener aquí](https://aistudio.google.com/app/apikey))

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Lucasechavarria/FolKode_Bot_IA.git
   cd FolKode_Bot_IA
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar la API de Gemini:**
   ```bash
   # El archivo .env.local ya existe, solo necesitas actualizar la API key
   # Edita .env.local y reemplaza PLACEHOLDER_API_KEY con tu clave real:
   GEMINI_API_KEY=tu_clave_api_real_aqui
   ```

4. **Iniciar la aplicación:**
   ```bash
   npm run dev
   ```

5. **¡Listo!** Abre **http://localhost:5173** en tu navegador

## 🔑 Obtener tu API Key de Google Gemini

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key" 
4. Selecciona un proyecto existente o crea uno nuevo
5. Copia la clave generada (debe empezar con `AIza`)
6. Pégala en tu archivo `.env.local`:
   ```bash
   GEMINI_API_KEY=AIzaSyC-tu_clave_real_aqui
   ```

## 🛠️ Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | 🚀 Inicia el servidor de desarrollo en puerto **5173** |
| `npm run build` | 📦 Construye la aplicación para producción |
| `npm run preview` | 👀 Previsualiza la build de producción |

## ⚙️ Características del Asistente

- 🌍 **Soporte multiidioma** (español, inglés, etc.)
- 💬 **Interfaz conversacional** intuitiva
- 🎯 **Captura de leads** integrada
- 📊 **Panel de analytics** (modo admin)
- 🎨 **Tema claro/oscuro** 
- 🎤 **Reconocimiento de voz** (en desarrollo)
- 📁 **Carga de archivos** PDF
- 📈 **Exportación de conversaciones**

## 🐛 Solución de Problemas Comunes

### ❌ "Failed to resolve import '@google/genai'"
```bash
# Limpia la cache e instala dependencias
rm -rf node_modules package-lock.json
npm install
```

### ❌ "process.env.GEMINI_API_KEY is undefined"
```bash
# 1. Verifica que el archivo .env.local existe
ls -la .env.local

# 2. Verifica el contenido (debe tener tu API key real)
cat .env.local

# 3. Si solo ves PLACEHOLDER_API_KEY, actualízalo:
# GEMINI_API_KEY=tu_clave_real_aqui
```

### ❌ "API key not valid" o errores de autenticación
- Verifica que tu API key sea correcta y empiece con `AIza`
- Asegúrate de que no tenga espacios extra al inicio o final
- Confirma que la API de Gemini esté habilitada en tu proyecto de Google Cloud
- Revisa los límites de tu API key en [Google AI Studio](https://aistudio.google.com/app/apikey)

### ❌ "Cannot connect to development server"
```bash
# Vite usa puerto 5173 por defecto
# Si está ocupado, automáticamente usará el siguiente disponible (5174, 5175, etc.)
# Revisa la consola para ver qué puerto está usando

# Para forzar un puerto específico:
npm run dev -- --port 3000
```

### ❌ Problemas de hot reload en desarrollo
```bash
# Reinicia el servidor de desarrollo
# Ctrl+C para detener
npm run dev
```

## 📁 Estructura del Proyecto

```
FolKode_Bot_IA/
├── src/
│   ├── components/          # Componentes React reutilizables
│   │   ├── ChatInterface.tsx
│   │   ├── LeadCaptureForm.tsx
│   │   └── LanguageSelector.tsx
│   ├── hooks/              # Custom hooks de React
│   │   ├── useAppLogic.ts
│   │   └── useChatManager.ts
│   ├── i18n/               # Archivos de internacionalización
│   │   └── locales.ts
│   ├── types/              # Definiciones TypeScript
│   ├── App.tsx            # Componente principal
│   └── index.tsx          # Punto de entrada
├── .env.local             # Variables de entorno (NO subir a git)
├── index.html             # Template HTML
├── package.json           # Configuración del proyecto
├── vite.config.ts         # Configuración de Vite
└── tsconfig.json          # Configuración de TypeScript
```

## 🔧 Desarrollo

Este es un proyecto **React + TypeScript + Vite**, NO un servidor Node.js tradicional.

- **Tipo:** Aplicación web frontend (Single Page Application)
- **Puerto de desarrollo:** 5173 (por defecto de Vite)
- **Hot reload:** Automático en modo desarrollo
- **Build:** Genera archivos estáticos optimizados en `/dist`
- **Framework:** React 19.1.0 con TypeScript

## 🌐 Funcionalidades

### Para Usuarios
- Selección de idioma al inicio
- Formulario de captura de información de contacto
- Chat interactivo con IA
- Sugerencias contextuales
- Exportación de conversaciones

### Para Administradores
- Panel de analytics
- Métricas de uso
- Gestión de conversaciones
- Modo administrador activable

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. Realiza tus cambios y commit:
   ```bash
   git commit -m 'feat: agregar nueva funcionalidad'
   ```
4. Push a tu rama:
   ```bash
   git push origin feature/nueva-funcionalidad
   ```
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas siguiendo estas instrucciones:

1. **Verifica tu versión de Node.js:** `node --version` (debe ser >= 18.0.0)
2. **Revisa que tu archivo `.env.local` tenga una API key válida**
3. **Comprueba la consola del navegador** para errores específicos
4. **Reinicia tu terminal** después de cambios en variables de entorno
5. **Limpia la cache** con `rm -rf node_modules package-lock.json && npm install`

Si el problema persiste, abre un [issue en GitHub](https://github.com/Lucasechavarria/FolKode_Bot_IA/issues) con:
- Tu versión de Node.js (`node --version`)
- El mensaje de error completo
- Los pasos que seguiste

---

## ⚠️ Notas Importantes

- **Este es una aplicación web React**, no un bot de Discord/Telegram tradicional
- **Se ejecuta en el navegador**, no como servidor backend
- **El archivo `.env.local` nunca debe subirse a Git** - contiene información sensible
- **Usa puerto 5173** por defecto (Vite), no 3000
- **Requiere una API key válida** de Google Gemini para funcionar

---

*Desarrollado por FolKode Group - Asistente de IA para mejorar la experiencia del usuario*