// ... todo el código anterior de Express y Axios ...

const PORT = process.env.PORT || 3000;

// IMPORTANTE: Escuchar en 0.0.0.0 es obligatorio en Railway
app.listen(PORT, "0.0.0.0", () => {
  console.log("========================================");
  console.log(`🚀 SERVIDOR ACTIVO EN PUERTO: ${PORT}`);
  console.log("========================================");
});
