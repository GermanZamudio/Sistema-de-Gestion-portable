// src/pages/BienesConsumo.jsx
import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { exportTableToPDF } from "../utils/exportPdf";

const Container = styled.div`
  max-width: 1100px;
  margin: 40px auto;
  padding: 0 24px;
  font-family: 'Inter', sans-serif;
`;

const CreateButton = styled.button`
  background-color: #28a745;
  color: white;
  padding: 6px 12px;
  font-size: 0.85rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:hover { background-color: #218838; }
`;

const PrimaryButton = styled(CreateButton)`
  background-color: #007bff;
  &:hover { background-color: #0069d9; }
`;

const Title = styled.p`
  font-size: 1.5rem;
  margin-bottom: 1.2rem;
`;

const SearchInput = styled.input`
  padding: 6px 10px;
  width: 100%;
  max-width: 350px;
  font-size: 0.85rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  margin-bottom: 20px;
  &::placeholder { color: #aaa; }
`;

const ErrorText = styled.p`
  color: red;
  font-size: 0.85rem;
  text-align: center;
`;

const TableWrapper = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border-radius: 10px;
  box-shadow: 0 0 6px rgba(0,0,0,0.04);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.5rem 0.7rem;
  font-weight: 500;
  font-size: 0.8rem;
  color: #777;
  background-color: #fafafa;
`;

const Td = styled.td`
  padding: 0.5rem 0.7rem;
  font-size: 0.8rem;
  vertical-align: top;
`;

const Tr = styled.tr`
  border-top: 1px solid #eee;
  transition: background-color 0.2s ease;
  &:first-child { border-top: none; }
  &:hover { background-color: #f9f9f9; }
`;

const ContainerHeader = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const ActionsRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const BackContainer = styled.div`
  text-align: center;
`;

const BackLink = styled.a`
  display: inline-block;
  margin-top: 20px;
  color: #1a936f;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  &:hover {
    text-decoration: underline;
    background-color: #f1f1f1;
  }
`;

export default function BienesConsumo() {
  const [articulos, setArticulos] = useState([]);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

  // Definición de columnas para el PDF (solo datos relevantes)
  const pdfColumns = useMemo(() => ([
    { header: "Nombre",      field: "nombre",  align: "center"  },
    { header: "Ubicación",   field: "ubicacion",  align: "center"  },
    { header: "Cantidad",    field: "cantidad",  align: "center" },
  ]), []);

  // Porcentajes de ancho (suma ~ 1) para ajustar a A4
  // Podés retocar estos valores si tu descripción es muy larga.
  const widthPercents = useMemo(() => [0.25, 0.35, 0.20, 0.10, 0.10], []);

  useEffect(() => {
    async function fetchArticulos() {
      try {
        const response = await window.api.get("/api/inventario/existencias/CONSUMO");
        if (response?.error) {
          setError(response.error);
          setArticulos([]);
        } else {
          setArticulos(Array.isArray(response) ? response : []);
          setError("");
        }
      } catch {
        setError("Error al cargar bienes de consumo");
        setArticulos([]);
      }
    }
    fetchArticulos();
  }, []);

  const filtro = busqueda.toLowerCase();

  const articulosFiltrados = useMemo(() => {
    return (articulos || []).filter((art) => {
      const nombreMatch = art.nombre?.toLowerCase().includes(filtro);
      const descMatch = art.descripcion?.toLowerCase().includes(filtro);
      const ubicacionMatch = (art.existencias || []).some((ex) =>
        ex.ubicacion?.toLowerCase().includes(filtro)
      );
      return nombreMatch || descMatch || ubicacionMatch;
    });
  }, [articulos, filtro]);

  const filasTabla = useMemo(() => {
    return articulosFiltrados.flatMap((articulo) =>
      (articulo.existencias || []).map((item, i) => ({
        key: `${articulo.id}-${item.existencia_id || i}`,
        nombre: articulo.nombre,
        ubicacion: item.ubicacion,
        cantidad: item.cantidad,
      }))
    );
  }, [articulosFiltrados]);

  // Exportar PDF
  const onExportarPDF = () => {
    if (!filasTabla.length) {
      alert("No hay datos para exportar");
      return;
    }
    const rows = filasTabla.map((f) => ({
      nombre: f.nombre,
      ubicacion: f.ubicacion || "—",
      cantidad: f.cantidad ?? 0,
    }));

    exportTableToPDF({
      title: "Bienes de Consumo",
      columns: pdfColumns,
      rows,
      fileName: "bienes_consumo.pdf",
      widthPercents,
      landscape: false, // poné true si preferís horizontal
      fontSize: 9,
      // Si en tu helper soportás estilos de encabezado, podés pasar algo como:
      // headStyles: { halign: 'center' }
    });
  };

  return (
    <Container>
      <Title>Bienes de Consumo</Title>

      <ContainerHeader>
        <ActionsRow>
          <CreateButton onClick={() => navigate("/crear-licitacion-consumo")}>
            Crear Licitación
          </CreateButton>
          <PrimaryButton onClick={onExportarPDF}>
            Exportar PDF
          </PrimaryButton>
        </ActionsRow>

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
            <thead>
              <Tr>
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
                  <Td colSpan="5" style={{ textAlign: "center", padding: "1rem", color: "#999" }}>
                    No hay bienes que coincidan con la búsqueda.
                  </Td>
                </Tr>
              ) : (
                filasTabla.map((fila) => (
                  <Tr key={fila.key}>
                    <Td>{fila.nombre}</Td>
                    <Td>{fila.descripcion || "Sin descripción"}</Td>
                    <Td>{fila.ubicacion || "—"}</Td>
                    <Td>{fila.cantidad ?? 0}</Td>
                    <Td style={{ color: (fila.pendiente ?? 0) > 0 ? "#d9534f" : "#333" }}>
                      {fila.pendiente ?? 0}
                    </Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </TableWrapper>
      )}

      <BackContainer>
        <BackLink onClick={() => navigate("/home")}>← Volver al inicio</BackLink>
      </BackContainer>
    </Container>
  );
}
