const express = require('express');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/precios', async (req, res) => {
  try {
    // URL oficial extraída de tu archivo .atomsvc
    const url = "https://estadisticas.dgehm.gob.sv/WebHidroPublico/Reporte_precios_bajos?rs:Command=Render&rs:Format=ATOM";
    
    const response = await axios.get(url);
    const parser = new XMLParser({ 
        ignoreAttributes: false, 
        removeNSPrefix: true 
    });
    
    const jsonObj = parser.parse(response.data);
    const entradas = jsonObj.feed.entry;

    // Transformamos los datos al formato que tu tabla necesita
    const estaciones = entradas.map(entry => {
      const prop = entry.content.properties;
      return {
        nombre: prop.Nombre_Estacion,
        ubicacion: prop.Direccion,
        regular: prop.Regular,
        especial: prop.Especial,
        diesel: prop.Diesel,
        fecha: new Date().toLocaleDateString()
      };
    });

    res.json({ precios: estaciones });
  } catch (error) {
    console.error("Error en el servidor:", error.message);
    res.status(500).json({ error: "No se pudieron obtener los datos" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor listo en puerto ${PORT}`));
