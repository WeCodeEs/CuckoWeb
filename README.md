# 🍽️ Cuckoo Web - Cafeteria Management System

Aplicación web construida con Vite + React + TypeScript. Permite la gestión de productos, pedidos y operaciones internas de la cafetería para Cuckoo

## ⚙️ Prerrequisitos

\- Node.js v18+  
\- npm (incluido con Node)  
\- (Opcional) ngrok o cloudflared para compartir la app fuera de tu red local

## 🚀 Instalación y configuración inicial

1\. Clona el repositorio:  
```
git clone <https://github.com/tu-usuario/CuckoWeb.git>  
cd CuckoWeb
```

2\. Instala dependencias:  
```
npm install
```

3\. Verifica configuración en tsconfig.json con:  
```
jsx: react-jsx y types: \[react, react-dom\]
```

4\. Si aparecen errores de JSX, instala tipos:  
```
npm install react react-dom  
npm install --save-dev @types/react @types/react-dom typescript
```

5\. Si el proyecto no arranca:  
```
rm -rf node_modules package-lock.json && npm install
```

## ⚙️ Configuración del archivo .env

1\. Duplica el archivo de ejemplo:  
```
cp .env.example .env  
```
2\. Abre el nuevo archivo .env y reemplaza los valores con tus credenciales reales.  
3\. No subas el archivo .env al repositorio (agregado en .gitignore).

## 🧩 Estructura del proyecto

CuckoWeb/  
├── src/  
├── tsconfig.json  
├── vite.config.ts  
├── package.json  
└── README.md

## 🧠 Scripts

```bash
npm run dev → Inicia el servidor local  
npm run dev -- --host → Inicia servidor visible por red local, otros dispositivo misma red local.
npm run build → Compila el proyecto  
npm run preview → Previsualiza la build  
npm run lint → Ejecuta ESLint
```

## 💻 Ejecutar en entorno local

Ejecuta:  
```
npm run dev  
```
<br/>Luego abre:  
<http://localhost:5173/>

## 🌐 Acceder desde otros dispositivos (misma red)

Ejecuta: 
``` 
npm run dev -- --host  
```
<br/>Ejemplo de salida:  
Local: <http://localhost:5173/>  
Network: <http://192.168.1.105:5173/>  
<br/>Abre la IP de Network desde otro dispositivo en la misma red Wi-Fi.

## 🌍 Acceder desde otra red o internet

Con ngrok:  
```
npm run dev -- --host  
ngrok http 5173  
```
Con Cloudflare Tunnel:  
```
npm run dev -- --host  
cloudflared tunnel --url <http://localhost:5173>
```

## 📦 Build para producción

```
npm run build  
```
<br/>Previsualizar con:  
```
npm run preview
```

    © 2025 — Cuckoo Web - gestión de cafetería.