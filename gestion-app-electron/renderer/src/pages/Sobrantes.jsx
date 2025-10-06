// src/pages/StockInventario.jsx
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

const Title = styled.p`
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  padding: 10px 14px;
  width: 100%;
  max-width: 480px;
  font-size: 0.95rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 24px;
  &::placeholder { color: #aaa; }
`;

const ErrorText = styled.p`
  color: red;
  font-size: 0.95rem;
`;

const TableWrapper = styled.div`
  max-height: 420px;
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
  &:hover { text-decoration: underline; }
`;

const ContainerHeader = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
`;

const PrimaryButton = styled.button`
  background-color: #28a745;
  color: white;
  padding: 8px 12px;
  font-size: 0.85rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-right: 8px;
  &:hover { background-color: #218838; }
`;

export default function StockInventario() {
  const [articulos, setArticulos] = useState([]);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

  // Columnas PDF (agrego Departamento y Orden)
  const pdfColumns = useMemo(() => ([
    { header: "Nombre",        field: "nombre",        align: "center" },
    { header: "Descripción",   field: "descripcion",   align: "center" },
    { header: "Ubicación",     field: "ubicacion",     align: "center" },
    { header: "Cantidad",      field: "cantidad",      align: "center" },
    { header: "Fecha",         field: "fecha",         align: "center" },
    { header: "Departamento",  field: "depto",         align: "center" }, // nuevo
    { header: "Orden",         field: "orden",         align: "center" }, // nuevo
  ]), []);

  // 7 columnas
  const widthPercents = useMemo(() => [0.16, 0.20, 0.12, 0.10, 0.12, 0.20, 0.10], []);

  useEffect(() => {
    async function fetchArticulos() {
      try {
        const response = await window.api.get("/api/inventario/sobrantes");
        if (response?.error) {
          setError(response.error);
          setArticulos([]);
        } else {
          setArticulos(Array.isArray(response) ? response : []);
          setError("");
        }
      } catch {
        setError("Error al cargar artículos");
        setArticulos([]);
      }
    }
    fetchArticulos();
  }, []);

  const filtro = busqueda.toLowerCase();

  const articulosFiltrados = useMemo(() => {
    return (articulos || []).filter((art) => {
      const nombreMatch = art.nombre?.toLowerCase().includes(filtro);
      const descMatch   = art.descripcion?.toLowerCase().includes(filtro);
      const ubicacionMatch = (art.existencias || []).some(
        (ex) =>
          ex.ubicacion?.toLowerCase().includes(filtro) ||
          ex.edificio_nombre?.toLowerCase().includes(filtro) ||
          ex.depto_piso?.toLowerCase().includes(filtro) ||
          ex.depto_numero?.toLowerCase().includes(filtro)
      );
      return nombreMatch || descMatch || ubicacionMatch;
    });
  }, [articulos, filtro]);

  const filasTabla = useMemo(() => {
    return articulosFiltrados.flatMap((articulo) =>
      (articulo.existencias || []).map((item) => {
        const deptoTexto = [
          item.edificio_nombre ? `${item.edificio_nombre}` : null,
          item.depto_piso ? `Piso ${item.depto_piso}` : null,
          item.depto_numero ? `Depto ${item.depto_numero}` : null,
        ].filter(Boolean).join(" – ");

        const ordenTexto = item.orden_numero ? `#${item.orden_numero}` : "—";

        return {
          key: `${articulo.id}-${item.id}`,
          imagen: articulo.imagen,
          nombre: articulo.nombre,
          descripcion: articulo.descripcion,
          ubicacion: item.ubicacion,
          cantidad: item.cantidad,
          fecha: item.fecha,
          depto: deptoTexto || "—",
          orden: ordenTexto,
        };
      })
    );
  }, [articulosFiltrados]);

  const onExportarPDF = () => {
    if (!filasTabla.length) {
      alert("No hay datos para exportar");
      return;
    }
    const rows = filasTabla.map((f) => ({
      nombre: f.nombre,
      descripcion: f.descripcion || "Sin descripción",
      ubicacion: f.ubicacion || "—",
      cantidad: f.cantidad ?? 0,
      fecha: f.fecha || "—",
      depto: f.depto || "—",
      orden: f.orden || "—",
    }));

    exportTableToPDF({
      title: "Inventario – Sobrantes",
      columns: pdfColumns,
      rows,
      fileName: "sobrantes_inventario.pdf",
      headStyles: { halign: 'center' },
      widthPercents,
      landscape: false,
      fontSize: 9,
    });
  };

  return (
    <Container>
      <Title>Inventario (Sobrantes)</Title>

      <ContainerHeader>
        <PrimaryButton onClick={onExportarPDF}>Exportar PDF</PrimaryButton>
        <SearchInput
          type="text"
          placeholder="Buscar por nombre, descripción, ubicación o departamento..."
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
                <Th>Imagen</Th>
                <Th>Nombre</Th>
                <Th>Descripción</Th>
                <Th>Ubicación</Th>
                <Th>Cantidad</Th>
                <Th>Fecha</Th>
                <Th>Departamento</Th>
                <Th>Orden</Th>
              </Tr>
            </thead>
            <tbody>
              {filasTabla.length === 0 ? (
                <Tr>
                  <Td colSpan="8" style={{ textAlign: "center", padding: "1rem", color: "#999" }}>
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
                        title={fila.nombre}
                      />
                    </Td>
                    <Td>{fila.nombre}</Td>
                    <Td>{fila.descripcion || "Sin descripción"}</Td>
                    <Td>{fila.ubicacion || "—"}</Td>
                    <Td>{fila.cantidad ?? 0}</Td>
                    <Td>{fila.fecha || "—"}</Td>
                    <Td title={fila.depto}>{fila.depto}</Td>
                    <Td>{fila.orden}</Td>
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
