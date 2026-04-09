const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let ultimaActualizacion = null;
let datosPrecios = [];

// Scraper mejorado con más espera y logs
async function actualizarPrecios() {
  console.log('🔄 Iniciando scraping de DGEHM...');
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('https://sinapp.dgehm.gob.sv/drhm/estadisticas.aspx?uid=2', {
      waitUntil: 'networkidle2',
      timeout: 90000
    });

    // Espera más tiempo y busca la tabla
    await page.waitForSelector('table', { timeout: 60000 });

    const datos = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr'));
      console.log('Filas encontradas:', rows.length); // para debug

      return rows.slice(1).map(row => {
        const cells = row.querySelectorAll('td');
        return {
          nombre: cells[0] ? cells[0].innerText.trim() : '',
          ubicacion: cells[1] ? cells[1].innerText.trim() : '',
          regular: cells[2] ? parseFloat(cells[2].innerText.trim()) : null,
          especial: cells[3] ? parseFloat(cells[3].innerText.trim()) : null,
          diesel: cells[4] ? parseFloat(cells[4].innerText.trim()) : null,
          fecha: cells[5] ? cells[5].innerText.trim() : ''
        };
      }).filter(r => r.nombre && r.nombre.length > 3);
    });

    await browser.close();

    if (datos.length > 0) {
      datosPrecios = datos;
      ultimaActualizacion = new Date();
      console.log(`✅ Éxito: ${datos.length} estaciones cargadas`);
    } else {
      console.log('⚠️ No se encontraron estaciones en la tabla');
    }

    return datos;
  } catch (error) {
    console.error('❌ Error en scraping:', error.message);
    return [];
  }
}

app.get('/precios', async (req, res) => {
  if (datosPrecios.length === 0) {
    await actualizarPrecios();
  }
  res.json({
    precios: datosPrecios,
    ultimaActualizacion: ultimaActualizacion
  });
});

setInterval(actualizarPrecios, 30 * 60 * 1000); // cada 30 minutos

app.listen(3000, () => {
  console.log('🚀 Backend iniciado');
  actualizarPrecios(); // primera carga
});
