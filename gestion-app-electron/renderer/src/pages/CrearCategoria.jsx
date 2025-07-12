import React, { useState, useEffect } from "react";

export default function CrearCategoria() {
  const [nombre, setNombre] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState("");

  // Cargar categorías al montar el componente
  useEffect(() => {
    async function fetchCategorias() {
      const respuesta = await window.api.get('/api/categoria');
      if (respuesta.error) {
        setError(respuesta.error);
      } else {
        setCategorias(respuesta);
      }
    }
    fetchCategorias();
  }, []);

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!nombre.trim()) {
      setError("El nombre no puede estar vacío");
      return;
    }

    const datos = { nombre: nombre.trim() };

    const respuesta = await window.api.post('/api/categoria', datos);
    if (respuesta.error) {
      setError("Error: " + respuesta.error);
    } else {
      setMensaje("Categoría creada correctamente");
      setNombre("");

      // Actualizar lista de categorías (recargar)
      const nuevaLista = await window.api.get('/api/categoria');
      if (nuevaLista.error) {
        setError(nuevaLista.error);
      } else {
        setCategorias(nuevaLista);
      }
    }
  };

  return (
    <div>
      <h2>Ingresar Categoría</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <button type="submit">Guardar</button>
      </form>

      {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <h3>Lista de Categorías</h3>
      <ul>
        {categorias.map((cat) => (
          <li key={cat.id}>{cat.nombre}</li>
        ))}
      </ul>
      <a href="/home">Volver atras</a>
    </div>
  );
}
