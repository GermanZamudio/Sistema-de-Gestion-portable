import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const Container = styled.div`
  max-width: 1100px;
  margin: 40px auto;
  padding: 0 24px;
  font-family: 'Inter', sans-serif;
`;

const Title = styled.p`
  font-size: 1.8rem;
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

const TableWrapper = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border-radius: 12px;
  box-shadow: 0 0 6px rgba(0,0,0,0.04);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.5rem 0.7rem; /* Más compacto */
  font-weight: 500;
  font-size: 0.8rem; /* Más compacto */
  color: #777;
  background-color: #fafafa;
`;

const Td = styled.td`
  padding: 0.5rem 0.7rem; /* Más compacto */
  font-size: 0.8rem; /* Más compacto */
  vertical-align: top;
`;

const Tr = styled.tr`
  border-top: 1px solid #eee;
  transition: background-color 0.2s ease;

  &:first-child {
    border-top: none;
  }

  &:hover {
    background-color: #f9f9f9; /* Resaltado leve */
  }
`;

const Imagen = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #ddd;
`;


const BackLink = styled.a`
  display: block;
  margin-top: 30px;
  color: #1a936f;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
  text-align: center;

  &:hover {
    text-decoration: underline;
  }
`;


export default function StockInventario() {
  const [articulos, setArticulos] = useState([]);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchArticulos() {
      try {
        const response = await window.api.get("/api/inventario/existencias/STOCK");
        if (response.error) {
          setError(response.error);
          setArticulos([]);
        } else {
          setArticulos(response);
          setError("");
        }
      } catch (err) {
        setError("Error al cargar artículos");
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
      <Title>Inventario</Title>

      <SearchInput
        type="text"
        placeholder="Buscar por nombre, descripción o ubicación..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {error && <ErrorText>{error}</ErrorText>}

      {!error && (
        <TableWrapper>
          <Table>
            <thead>
              <Tr>
                <Th>Imagen</Th>
                <Th>Nombre</Th>
                <Th>Descripción</Th>
                <Th>Ubicación</Th>
                <Th>Cantidad</Th>
                <Th>Pendiente</Th>
              </Tr>
            </thead>
            <tbody>
              {filasTabla.length === 0 ? (
                <Tr>
                  <Td colSpan="6" style={{ textAlign: "center", padding: "1rem", color: "#999" }}>
                    No hay artículos que coincidan con la búsqueda.
                  </Td>
                </Tr>
              ) : (
                filasTabla.map((fila) => (
                  <Tr key={fila.key}>
                    <Td>
                      <Imagen
                        src={fila.imagen || "https://via.placeholder.com/60?text=Sin+imagen"}
                        alt={`Imagen de ${fila.nombre}`}
                      />
                    </Td>
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
        </TableWrapper>
      )}

      <BackLink onClick={() => navigate("/home")}>← Volver al inicio</BackLink>
    </Container>
  );
}
