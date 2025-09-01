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
  padding: 8px 12px;
  font-size: 0.85rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background-color: #218838;
  }
`;
const Title = styled.p`
  font-size: 1.8rem;
  margin-bottom: 1.2rem;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  width: 100%;
  max-width: 350px;
  font-size: 0.85rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 20px;

  &::placeholder {
    color: #aaa;
  }
`;

const ErrorText = styled.p`
  color: red;
  font-size: 0.85rem;
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
  margin-top: 0.5rem;
`;

const Thead = styled.thead`
  background-color: #fafafa;
`;

const Tr = styled.tr`
  border-top: 1px solid #eee;

  &:first-child {
    border-top: none;
  }

  &:hover {
    background-color: #f9f9f9; /* Resaltado leve */
  }
`;

const Th = styled.th`
  text-align: left;
  padding: 0.5rem;       /* Más chico */
  font-weight: 500;
  font-size: 0.8rem;     /* Más chico */
  color: #777;
`;

const Td = styled.td`
  padding: 0.5rem;       /* Más chico */
  font-size: 0.8rem;     /* Más chico */
  vertical-align: top;
`;

const ContainerHeader = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
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
      <ContainerHeader>
        <CreateButton onClick={() => navigate("/crear-licitacion-uso")}>
          Crear Licitación
        </CreateButton>
        <SearchInput
          type="text"
          placeholder="Buscar por nombre, descripción o ubicación..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </ContainerHeader>

      {error && <ErrorText>{error}</ErrorText>}

      {!error && (
        <TableWrapper>
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
        </TableWrapper>
      )}

      <BackLink onClick={() => navigate("/home")}>← Volver al inicio</BackLink>
    </Container>
  );
}
