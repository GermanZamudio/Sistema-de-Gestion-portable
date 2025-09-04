// src/pages/Herramientas.jsx
import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import ModalHerramientas from "../components/Modals/CreateHerramienta";
import ModalArticle from "../components/Modals/CreateArticle";
import AjustarCantidadModal from "../components/Modals/AjustarCantidad";
import { exportTableToPDF } from "../utils/exportPdf";

// ======= Estilos =======
const Container = styled.div`
  max-width: 1000px;
  margin: 30px auto;
  padding: 0 20px;
  font-family: 'Inter', sans-serif;
`;

const Title = styled.p`
  font-size: 1.6rem;
  margin-bottom: 15px;
`;

const ButtonNew = styled.button`
  background-color: #1a936f;
  color: white;
  font-weight: 500;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  margin-right: 8px;
  margin-bottom: 15px;

  &:hover { background-color: #168765; }
`;

const SearchInput = styled.input`
  padding: 6px 10px;
  font-size: 0.85rem;
  border: 1px solid #dcdcdc;
  border-radius: 6px;
  width: 250px;
  outline: none;
  color: #333;
  &::placeholder { color: #b2b2b2; }
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
  padding: 0.6rem 0.8rem;
  text-align: left;
  font-size: 0.8rem;
  background-color: #f9f9f9;
  font-weight: 600;
  border-bottom: 1px solid #eee;
`;

const Td = styled.td`
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
  vertical-align: top;
`;

const Tr = styled.tr`
  border-top: 1px solid #eee;
  transition: background-color 0.2s ease;
  &:first-child { border-top: none; }
  &:hover { background-color: #f8f8f8; }
`;

const Img = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 6px;
  border: 1px solid #e2e2e2;
`;

const ErrorText = styled.p`
  color: red;
  margin-top: 12px;
  text-align: center;
  font-size: 0.85rem;
`;

const BackContainer = styled.div`
  text-align: center;
`;

const BackLink = styled.a`
  display: block;
  margin-top: 30px;
  color: #1a936f;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
  &:hover { text-decoration: underline; }
`;

const ContainerHeader = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between; 
  margin-bottom: 10px;
`; 

const PrimaryButton = styled.button`
  background-color: #28a745;
  color: white;
  padding: 6px 14px;
  font-size: 0.85rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-right: 8px;
  &:hover { background-color: #218838; }
`;

// ======= Componente Principal =======
export default function Herramientas() {
  const [modalOpen, setModalOpen] = useState(false);
  const [herramientas, setHerramientas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [modalOpen2, setModalOpen2] = useState(false);
  const [ajusteModalOpen, setAjusteModalOpen] = useState(false);
  const [herramientaSeleccionada, setHerramientaSeleccionada] = useState(null);

  // Columnas para el PDF (sin imagen ni acciones)
  const pdfColumns = useMemo(() => ([
    { header: "Nombre",      field: "nombre",  align: "center"},
    { header: "Código",      field: "codigo",  align: "center"},
    { header: "Existencias", field: "existencias",  align: "center"},
  ]), []);

  // Porcentajes de ancho (suma ≈ 1)
  const widthPercents = useMemo(() => [0.25, 0.15, 0.35, 0.15, 0.10], []);

  const abrirAjusteModal = (herramienta) => {
    setHerramientaSeleccionada(herramienta);
    setAjusteModalOpen(true);
  };

  const confirmarAjuste = async (cantidadAjuste, causa) => {
    try {
      const payload = [{
        id: herramientaSeleccionada.id,
        cantidad_existencia: cantidadAjuste,
        causa,
        ubicacion_id: herramientaSeleccionada.existencias[0]?.ubicacion_id ?? 1,
      }];
      const response = await window.api.post("/api/inventario/ajuste-cant-herramienta", { articulo: payload });
      if (response?.mensaje) {
        const refreshed = await window.api.get("/api/inventario/existencias/HERRAMIENTA");
        setHerramientas(refreshed);
      }
    } catch (err) {
      console.error("Error al ajustar cantidad:", err);
    }
    setAjusteModalOpen(false);
  };

  const fetchHerramientas = async () => {
    try {
      const response = await window.api.get("/api/inventario/existencias/HERRAMIENTA");
      if (Array.isArray(response)) {
        setHerramientas(response);
        setError("");
      } else if (response?.error) {
        setError(response.error);
        setHerramientas([]);
      } else {
        setError("Datos recibidos no son un arreglo.");
        setHerramientas([]);
      }
    } catch {
      setError("Error al cargar Herramientas");
      setHerramientas([]);
    }
  };

  useEffect(() => {
    fetchHerramientas();
  }, []);

  const filtrados = useMemo(() => {
    return (herramientas || []).filter((a) => {
      const texto = `${a.nombre} ${a.descripcion} ${a.codigo || ""}`.toLowerCase();
      return texto.includes(busqueda.toLowerCase());
    });
  }, [herramientas, busqueda]);

  // Exportación a PDF
  const onExportarPDF = () => {
    if (!filtrados.length) {
      alert("No hay datos para exportar");
      return;
    }
    const rows = filtrados.map((a) => {
      const totalExistencias = (a.existencias || []).reduce((acc, ex) => acc + ex.cantidad, 0);
      return {
        nombre: a.nombre,
        codigo: a.codigo ?? "-",
        existencias: totalExistencias,
      };
    });
    exportTableToPDF({
      title: "Herramientas",
      columns: pdfColumns,
      rows,
      fileName: "herramientas.pdf",
      widthPercents,
      landscape: false, // true si prefieres orientación horizontal
      fontSize: 9,
    });
  };

  return (
    <Container>
      <Title>Herramientas</Title>

      {/* Modales de creación */}
      <ModalHerramientas
        isOpen={modalOpen}
        title="Crear herramienta"
        onClose={() => setModalOpen(false)}
        fetchHerramientas={fetchHerramientas}
      />
      <ModalArticle
        isOpen={modalOpen2}
        title="Crear artículo"
        onClose={() => setModalOpen2(false)}
      />
      <AjustarCantidadModal
        isOpen={ajusteModalOpen}
        onClose={() => setAjusteModalOpen(false)}
        onConfirm={confirmarAjuste}
        articulo={herramientaSeleccionada}
      />

      {/* Botones de acción */}
      <div>
        <ButtonNew onClick={() => setModalOpen(true)}>+ Nueva herramienta</ButtonNew>
        <ButtonNew onClick={() => setModalOpen2(true)}>+ Nuevo artículo</ButtonNew>
      </div>

      {/* Buscador y PDF */}
      <ContainerHeader>
        <PrimaryButton onClick={onExportarPDF}>Exportar PDF</PrimaryButton>
        <SearchInput
          type="text"
          placeholder="Buscar por nombre, código o descripción"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </ContainerHeader>

      {error && <ErrorText>{error}</ErrorText>}

      {filtrados.length > 0 && (
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>Imagen</Th>
                <Th>Nombre</Th>
                <Th>Código</Th>
                <Th>Descripción</Th>
                <Th>Precio</Th>
                <Th>Existencias</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((art) => (
                <Tr key={art.id}>
                  <Td>
                    <Img
                      src={art.imagen || "https://via.placeholder.com/48?text=Sin+imagen"}
                      alt={art.nombre}
                    />
                  </Td>
                  <Td>{art.nombre}</Td>
                  <Td>{art.codigo || "-"}</Td>
                  <Td>{art.descripcion || "-"}</Td>
                  <Td>${Number(art.precio ?? 0).toFixed(2)}</Td>
                    <Td>
                      {art.existencias.length > 0
                        ? `Total: ${art.existencias.reduce((acc, ex) => acc + ex.cantidad, 0)}`
                        : "Sin existencias"}
                    </Td>
                  <Td>
                    <ButtonNew onClick={() => abrirAjusteModal(art)}>Ajustar</ButtonNew>
                    <ButtonNew>Eliminar</ButtonNew>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      )}

      {filtrados.length === 0 && !error && <p>No hay herramientas para mostrar.</p>}

      <BackContainer>
        <BackLink href="/home">← Volver al inicio</BackLink>
      </BackContainer>
    </Container>
  );
}
