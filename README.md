# Habita

App móvil que te ayuda a escoger muebles para tu casa. Tomas una foto del espacio, escribes lo
que quieres ("un sofá con cojines y una alfombra") y la app:

- analiza los colores y el estilo de tu foto,
- busca muebles reales en Éxito y Falabella que combinen con tu espacio,
- te muestra cómo quedaría cada uno dentro de tu foto,
- te da el precio real y el enlace para comprarlo.

También puede ordenar la foto (quitar cajas, ropa y objetos sueltos) antes de poner los muebles.

Proyecto final de **Diseño de Interfaces de Software**.

## Estructura

```
mobile/   App en Expo (React Native) con TypeScript y Expo Router
server/   Backend en Node 24 + Express + SQLite (node:sqlite)
```

- **IA de texto y análisis de fotos:** Gemini (Google AI Studio).
- **Imágenes:** Cloudflare Workers AI (`flux-2-klein-4b`) para dibujar el mueble en la foto.
- **Tiendas:** búsqueda pública de Éxito y resultados de búsqueda de Falabella.

Las llaves de las APIs viven solo en el servidor (`server/.env`), nunca en la app.

## Cómo correrlo

Servidor:

```bash
cd server
npm install
# crear server/.env con GEMINI_API_KEY, CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN
npm run dev            # puerto 3000
```

App:

```bash
cd mobile
npm install
# en mobile/.env: EXPO_PUBLIC_API_URL=http://<ip-del-computador>:3000
npx expo start         # escanear el QR con Expo Go
```

## Sin login

La app crea un identificador al abrirse por primera vez y lo envía en cada petición. Espacios,
proyectos y créditos pertenecen a ese dispositivo.
