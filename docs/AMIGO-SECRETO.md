# Amigo Secreto (www.mandakovic.cl/amigosecreto)

Mini sitio estático que vive en `public/amigosecreto/`. Vue CLI copia todo `public/` tal cual a `dist/`, así que no pasa por Vue, no agrega dependencias y no cambia el build de Netlify. Es gratis y se publica junto con el resto del sitio.

## Preparar el sorteo (una vez al año)

1. Entra a `https://www.mandakovic.cl/amigosecreto/#/admin` (en local: `npm run serve` y `http://localhost:8080/amigosecreto/#/admin`).
2. **Evento:** nombre, fecha, presupuesto, lugar y paleta.
3. **Familia:** suelta las fotos (si cada archivo se llama como la persona, p. ej. `Tía Carmen.jpg`, el nombre se rellena solo). Opcional: ideas de regalo, WhatsApp y color de grupo (quienes comparten color no se regalan entre sí).
4. **Sorteo:** *Hacer el sorteo* y *Descargar sorteo.json*.
5. Guarda el archivo como `public/amigosecreto/data/sorteo.json`, haz commit y push. Netlify publica solo.
6. De vuelta en el panel, envía a cada persona su link y código por WhatsApp.

## Privacidad: qué hay realmente en el repo

`sorteo.json` va **completamente cifrado**: nombres, fotos, datos del evento y resultados. En el repo (aunque sea público) solo hay texto ilegible; no se puede ver ni quiénes participan ni sus fotos.

- **Código de la familia** (8 caracteres, lo genera el panel): abre el archivo. Viaja dentro del link personal de cada persona (`#/yo/...&k=...`), que va en el fragmento de la URL y nunca llega al servidor ni al repo. Quien abre el sitio sin link debe escribirlo; el navegador lo recuerda después.
- **Código personal** (6 caracteres): descifra solo a quién le toca a esa persona.
- El sorteo se hace en el navegador y el panel nunca muestra los resultados.

Si alguien reenvía su link, esa persona verá la lista de la familia, pero no a quién le regala el resto.

## Notas

- El panel (`#/admin`) es público pero inofensivo: trabaja solo en el navegador de quien lo abre y no puede cambiar nada del sitio publicado.
- Cambiar nombres, fotos, ideas de regalo o datos del evento: edita en el panel y descarga de nuevo el archivo; el sorteo se conserva. Agregar o quitar personas obliga a rehacer el sorteo.
- El borrador del panel se guarda en el navegador que usaste.
- `public/_headers` evita el caché del sorteo y que los buscadores indexen la página; `public/_redirects` lleva `/amigosecreto` a `/amigosecreto/`.
- Para empezar de cero cada año, reemplaza `sorteo.json` por uno nuevo.
