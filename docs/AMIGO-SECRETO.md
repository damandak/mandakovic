# Amigo Secreto (www.mandakovic.cl/amigosecreto)

Mini sitio estático que vive en `public/amigosecreto/`. Vue CLI copia todo `public/` tal cual a `dist/`, así que no pasa por Vue, no agrega dependencias y no cambia el build de Netlify. Es gratis y se publica junto con el resto del sitio.

## Preparar el sorteo (una vez al año)

1. Entra a `https://www.mandakovic.cl/amigosecreto/#/admin` (en local: `npm run serve` y `http://localhost:8080/amigosecreto/#/admin`).
2. **Evento:** nombre, fecha, presupuesto, lugar y paleta.
3. **Familia:** suelta las fotos (si cada archivo se llama como la persona, p. ej. `Tía Carmen.jpg`, el nombre se rellena solo). Opcional: ideas de regalo, WhatsApp y color de grupo (quienes comparten color no se regalan entre sí).
4. **Sorteo:** *Hacer el sorteo* y *Descargar sorteo.json*.
5. Guarda el archivo como `public/amigosecreto/data/sorteo.json`, haz commit y push. Netlify publica solo.
6. De vuelta en el panel, envía a cada persona su link y código por WhatsApp.

## Cómo se mantiene el secreto

El sorteo se hace en el navegador. Cada resultado se cifra (AES-GCM, clave PBKDF2) con el código personal de 6 caracteres; `sorteo.json` solo contiene nombres, fotos y resultados cifrados. El panel nunca muestra los resultados.

## Notas

- Si el repo es público, `sorteo.json` también lo es: se verán los nombres y las fotos, pero no a quién le toca a quién.
- Cambiar nombres, fotos, ideas de regalo o datos del evento: edita en el panel y descarga de nuevo el archivo; el sorteo se conserva. Agregar o quitar personas obliga a rehacer el sorteo.
- El borrador del panel se guarda en el navegador que usaste.
- `public/_headers` evita el caché del sorteo y que los buscadores indexen la página; `public/_redirects` lleva `/amigosecreto` a `/amigosecreto/`.
- Para empezar de cero cada año, reemplaza `sorteo.json` por uno nuevo.
