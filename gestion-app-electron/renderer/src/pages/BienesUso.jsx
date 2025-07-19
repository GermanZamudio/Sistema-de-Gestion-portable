import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const Container = styled.div`
  max-width: 1100px;
  margin: 40px auto;
  padding: 0 24px;
  font-family: 'Inter', sans-serif;
`;
const CreateButton = styled.button`
  background-color: #28a745;
  color: white;
  padding: 10px 16px;
  font-size: 0.95rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background-color: #218838;
  }
`;
const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  padding: 10px 14px;
  width: 100%;
  max-width: 400px;
  font-size: 0.95rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 24px;

  &::placeholder {
    color: #aaa;
  }
`;

const ErrorText = styled.p`
  color: red;
  font-size: 0.95rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 6px rgba(0,0,0,0.04);
`;

const Thead = styled.thead`
  background-color: #fafafa;
`;

const Tr = styled.tr`
  border-top: 1px solid #eee;

  &:first-child {
    border-top: none;
  }
`;

const Th = styled.th`
  text-align: left;
  padding: 1rem;
  font-weight: 500;
  font-size: 0.9rem;
  color: #777;
`;

const Td = styled.td`
  padding: 1rem;
  font-size: 0.95rem;
  vertical-align: top;
`;

const Imagen = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #ddd;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  margin-top: 2rem;
  font-size: 0.95rem;
  color: #007bff;
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: #0056b3;
  }
`;

export default function BienesUso() {
  const [articulos, setArticulos] = useState([]);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchArticulos() {
      try {
        const response = await window.api.get("/api/inventario/existencias/USO");
        if (response.error) {
          setError(response.error);
          setArticulos([]);
        } else {
          setArticulos(response);
          setError("");
        }
      } catch (err) {
        setError("Error al cargar bienes de uso");
        setArticulos([]);
      }
    }
    fetchArticulos();
  }, []);

  const filtro = busqueda.toLowerCase();

  const articulosFiltrados = useMemo(() => {
    return articulos.filter((art) => {
      const nombreMatch = art.nombre?.toLowerCase().includes(filtro);
      const descMatch = art.descripcion?.toLowerCase().includes(filtro);
      const ubicacionMatch = art.existencias.some((ex) =>
        ex.ubicacion?.toLowerCase().includes(filtro)
      );
      return nombreMatch || descMatch || ubicacionMatch;
    });
  }, [articulos, filtro]);

  const filasTabla = articulosFiltrados.flatMap((articulo) =>
    articulo.existencias.map((item, i) => ({
      key: `${articulo.id}-${item.existencia_id || i}`,
      imagen: articulo.imagen,
      nombre: articulo.nombre,
      descripcion: articulo.descripcion,
      ubicacion: item.ubicacion,
      cantidad: item.cantidad,
      pendiente: item.pendiente,
    }))
  );

  return (
    <Container>
      <Title>Bienes de Uso</Title>
      <CreateButton onClick={() => navigate("/crear-licitacion-uso")}>
        Crear Licitación
      </CreateButton>
      <SearchInput
        type="text"
        placeholder="Buscar por nombre, descripción o ubicación..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {error && <ErrorText>{error}</ErrorText>}

      {!error && (
        <Table>
          <Thead>
            <Tr>
              <Th>Nombre</Th>
              <Th>Descripción</Th>
              <Th>Ubicación</Th>
              <Th>Cantidad</Th>
              <Th>Pendiente</Th>
            </Tr>
          </Thead>
          <tbody>
            {filasTabla.length === 0 ? (
              <Tr>
                <Td colSpan="6" style={{ textAlign: "center", padding: "1rem", color: "#999" }}>
                  No hay bienes que coincidan con la búsqueda.
                </Td>
              </Tr>
            ) : (
              filasTabla.map((fila) => (
                <Tr key={fila.key}>
                  <Td>{fila.nombre}</Td>
                  <Td>{fila.descripcion || "Sin descripción"}</Td>
                  <Td>{fila.ubicacion}</Td>
                  <Td>{fila.cantidad}</Td>
                  <Td style={{ color: fila.pendiente > 0 ? "#d9534f" : "#333" }}>
                    {fila.pendiente}
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      <BackButton onClick={() => navigate("/home")}>← Volver al inicio</BackButton>
    </Container>
  );
}
