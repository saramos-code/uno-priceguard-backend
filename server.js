const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

app.get('/precios', async (req, res) => {
  try {
    // La URL que sacamos de tu archivo .atomsvc
    const urlDGEHM = "http://estadisticas.dgehm.gob.sv/WebHidroPublico/Reporte_precios_bajos"; 
    
    const response = await axios.get(urlDGEHM, { params: { 'rs:Format': 'ATOM' } });
    
    const parser = new XMLParser({ ignoreAttributes: false });
    const jsonObj = parser.parse(response.data);

    // Limpiamos los datos para que tu tabla los entienda
    const estaciones = jsonObj.feed.entry.map(item => ({
      nombre: item.content['m:properties']['d:Nombre_Estacion'],
      ubicacion: item.content['m:properties']['d:Direccion'],
      regular: item.content['m:properties']['d:Regular'],
      especial: item.content['m:properties']['d:Especial'],
      diesel: item.content['m:properties']['d:Diesel'],
      fecha: new Date().toLocaleDateString()
    }));

    res.json({ precios: estaciones });
  } catch (error) {
    res.status(500).json({ error: "Error conectando con DGEHM" });
  }
});
