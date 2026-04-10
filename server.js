const express = require('express');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const cors = require('cors');

const app = express();

// 1. Configuración de CORS para que tu HTML pueda leer los datos
app.use(cors());

// 2. Ruta de prueba (para saber si el backend está vivo)
app.get('/', (req, res) => {
  res.send('🚀 PriceGuard Backend de El Salvador está en línea y funcionando.');
});

// 3. Ruta principal de Precios
app.get('/precios', async (req, res) => {
  try {
    // URL del reporte ATOM que proporcionaste
    const urlDGEHM = "https://estadisticas.dgehm.gob.sv/WebHidroPublico/Reporte_precios_bajos?rs:Command=Render&rs:Format=ATOM";
    
    // Petición con identidad de navegador para evitar bloqueos
    const response = await axios.get(urlDGEHM, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*'
      },
      timeout: 10000 // 10 segundos de espera máxima
    });
    
    // Configuración del lector de XML
    const parser = new XMLParser({ 
      ignoreAttributes: false, 
      removeNSPrefix: true 
    });
    
    const jsonObj = parser.parse(response.data);
    
    // Accedemos a la lista de estaciones (manejamos si viene vacío)
    const entradas = jsonObj.feed?.entry || [];
    
    // Si solo hay una estación, fast-xml-parser a veces no devuelve un array, lo corregimos:
    const listaFinal = Array.isArray(entradas) ? entradas : [entradas];

    const estaciones = listaFinal.map(entry => {
      const prop = entry.content?.properties || {};
      return {
        nombre: prop.Nombre_Estacion || 'N/A',
        ubicacion: prop.Direccion || 'Ubicación no disponible',
        regular: prop.Regular || '0.00',
        especial: prop.Especial || '0.00',
        diesel: prop.Diesel || '0.00',
        fecha: new Date().toLocaleDateString('es-SV')
      };
    });

    res.json({ precios: estaciones });

  } catch (error) {
    console.error("Error detallado:", error.message);
    res.status(500).json({ 
      error: "Error al conectar con DGEHM", 
      detalles: error.message 
    });
  }
});

// 4. Configuración del Puerto para Railway (CRÍTICO)
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("========================================");
  console.log(`✅ SERVIDOR PRICEGUARD LISTO`);
  console.log(`📍 Puerto: ${PORT}`);
  console.log("========================================");
});
