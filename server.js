const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let ultimaActualizacion = null;
let datosPrecios = [];

// Función que hace el scraping real
async function actualizarPrecios() {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('https://sinapp.dgehm.gob.sv/drhm/estadisticas.aspx?uid=2', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    const datos = await page.evaluate(() => {
      const filas = Array.from(document.querySelectorAll('table tr')).slice(1);
      return filas.map(fila => {
        const celdas = fila.querySelectorAll('td');
        return {
          nombre: celdas[0] ? celdas[0].innerText.trim() : '',
          ubicacion: celdas[1] ? celdas[1].innerText.trim() : '',
          regular: celdas[2] ? parseFloat(celdas[2].innerText.trim()) : null,
          especial: celdas[3] ? parseFloat(celdas[3].innerText.trim()) : null,
          diesel: celdas[4] ? parseFloat(celdas[4].innerText.trim()) : null,
          fecha: celdas[5] ? celdas[5].innerText.trim() : ''
        };
      }).filter(r => r.nombre);
    });

    await browser.close();

    datosPrecios = datos;
    ultimaActualizacion = new Date();
    console.log('✅ Precios actualizados desde DGEHM');
    return datos;
  } catch (error) {
    console.error('Error en scraping:', error);
    return [];
  }
}

// Ruta para que el dashboard pida los datos
app.get('/precios', async (req, res) => {
  if (datosPrecios.length === 0) {
    await actualizarPrecios();
  }
  res.json({
    precios: datosPrecios,
    ultimaActualizacion: ultimaActualizacion
  });
});

// Actualizar automáticamente cada 30 minutos
setInterval(actualizarPrecios, 30 * 60 * 1000);

app.listen(3000, () => {
  console.log('🚀 PriceGuard Backend corriendo en puerto 3000');
  actualizarPrecios(); // Primera actualización al encender
});
