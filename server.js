const express = require('express');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const cors = require('cors');

const app = express();
app.use(cors());

// Ruta principal para que Railway sepa que el sitio está vivo
app.get('/', (req, res) => {
  res.send('PriceGuard Backend está en línea 🚀');
});

app.get('/precios', async (req, res) => {
  try {
    const url = "https://estadisticas.dgehm.gob.sv/WebHidroPublico/Reporte_precios_bajos?rs:Command=Render&rs:Format=ATOM";
    
    // Le decimos a la DGEHM que somos un navegador normal
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
    const jsonObj = parser.parse(response.data);
    
    // Si la DGEHM devuelve una lista vacía o diferente, evitamos que el código explote
    const entradas = jsonObj.feed?.entry || [];
    const estaciones = Array.isArray(entradas) ? entradas.map(entry => {
      const prop = entry.content.properties;
      return {
        nombre: prop.Nombre_Estacion,
        ubicacion: prop.Direccion,
        regular: prop.Regular,
        especial: prop.Especial,
        diesel: prop.Diesel,
        fecha: new Date().toLocaleDateString()
      };
    }) : [];

    res.json({ precios: estaciones });
  } catch (error) {
    console.error("Error detallado:", error.message);
    res.status(500).json({ error: "No se pudieron obtener datos" });
  }
});

// CONFIGURACIÓN CRÍTICA PARA RAILWAY
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
