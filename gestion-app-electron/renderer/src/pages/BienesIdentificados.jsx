// BienesIdentificados.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useNavigate, useParams } from "react-router-dom";

const Container = styled.div`
  max-width: 1100px;
  margin: 40px auto;
  padding: 0 24px;
  font-family: 'Inter', sans-serif;
`;
const Title = styled.p`
  font-size: 1.8rem;
  margin-bottom: 1.2rem;
`;
const SubTitle = styled.p`
  font-size: 1rem;
  margin: 0 0 12px 0;
  color: #555;
`;
const ControlsRow = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;
const LeftControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;
const RightControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;
const BackButton = styled.button`
  background-color: #6c757d;
  color: white;
  padding: 8px 12px;
  font-size: 0.85rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  &:hover { background-color: #5a6268; }
`;
const SearchInput = styled.input`
  padding: 8px 12px;
  width: 100%;
  max-width: 300px;
  font-size: 0.85rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  &::placeholder { color: #aaa; }
`;
const Select = styled.select`
  padding: 8px 12px;
  font-size: 0.85rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: white;
`;
const ErrorText = styled.p`
  color: red;
  font-size: 0.85rem;
  margin-bottom: 12px;
`;
const TableWrapper = styled.div`
  max-height: 480px;
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
  &:first-child { border-top: none; }
  &:hover { background-color: #f9f9f9; }
`;
const Th = styled.th`
  text-align: left;
  padding: 0.5rem;
  font-weight: 500;
  font-size: 0.8rem;
  color: #777;
`;
const Td = styled.td`
  padding: 0.5rem;
  font-size: 0.8rem;
  vertical-align: top;
`;
const ActionButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 6px 10px;
  border: none;
  border-radius: 8px;
  font-size: 0.78rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  &:hover { background-color: #0069d9; }
`;
const DangerButton = styled(ActionButton)`
  background-color: #dc3545;
  &:hover { background-color: #c82333; }
`;
const MutedButton = styled(ActionButton)`
  background-color: #6c757d;
  &:hover { background-color: #5a6268; }
`;
const SubTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0 0 0;
  background: #fff;
`;
const SubTr = styled.tr`
  border-top: 1px dashed #e9ecef;
`;
const SubTh = styled.th`
  text-align: left;
  padding: 6px;
  font-weight: 600;
  font-size: 0.78rem;
  color: #666;
  background: #fcfcfc;
`;
const SubTd = styled.td`
  padding: 6px;
  font-size: 0.78rem;
`;

// Badge de estado
const EstadoPill = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #fff;
  background-color: ${(p) =>
    p.estado === "ALTA" ? "#28a745" :
    p.estado === "OBSERVACION" ? "#ffc107" :
    p.estado === "BAJA" ? "#dc3545" : "#6c757d"};
`;

// Modal unificado
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;
const ModalCard = styled.div`
  background: white;
  width: 100%;
  max-width: 520px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  padding: 16px;
`;
const ModalTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1.05rem;
`;
const ModalText = styled.p`
  margin: 0 0 12px 0;
  color: #555;
  font-size: 0.9rem;
`;
const ModalTextarea = styled.textarea`
  width: 100%;
  min-height: 100px;
  resize: vertical;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-family: inherit;
  font-size: 0.9rem;
  margin-bottom: 12px;
`;
const ModalActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

export default function BienesIdentificados() {
  const { id } = useParams(); // articuloId
  const navigate = useNavigate();

  const [identificados, setIdentificados] = useState([]);
  const [articuloNombre, setArticuloNombre] = useState("");
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [expand, setExpand] = useState({});
  const [cargando, setCargando] = useState(false);

  // Filtro por estado del servidor (?estado=)
  const [estadoFiltro, setEstadoFiltro] = useState("TODOS");

  // Modal unificado: mode = 'OBSERVACION' | 'BAJA'
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [modalRow, setModalRow] = useState(null);
  const [modalCausa, setModalCausa] = useState("");
  const [guardandoEstado, setGuardandoEstado] = useState(false);

  useEffect(() => {
    async function fetchIdentificados() {
      try {
        setCargando(true);
        const qs = estadoFiltro !== "TODOS" ? `?estado=${estadoFiltro}` : "";
        const resp = await window.api.get(`/api/inventario/identificados/${id}${qs}`);
        if (resp?.error) {
          setError(resp.error);
          setIdentificados([]);
          setArticuloNombre("");
        } else {
          const data = Array.isArray(resp) ? resp : [];
          setIdentificados(data);
          setArticuloNombre(data[0]?.articulo_nombre || "");
          setError("");
        }
      } catch {
        setError("Error al cargar bienes identificados");
        setIdentificados([]);
        setArticuloNombre("");
      } finally {
        setCargando(false);
      }
    }
    if (id) fetchIdentificados();
  }, [id, estadoFiltro]);

  const filtro = busqueda.toLowerCase();

  const dataFiltrada = useMemo(() => {
    return (identificados || []).filter((item) => {
      const code = item?.codigo?.toLowerCase() || "";
      const ubic = item?.ubicacion_actual?.nombre?.toLowerCase() || "";
      const destinoMatch = (item?.ordenes || []).some(
        (o) =>
          (o?.destino || "").toLowerCase().includes(filtro) ||
          (o?.codigo || "").toLowerCase().includes(filtro)
      );
      return code.includes(filtro) || ubic.includes(filtro) || destinoMatch;
    });
  }, [identificados, filtro]);

  const toggleExpand = (identId) => {
    setExpand((prev) => ({ ...prev, [identId]: !prev[identId] }));
  };

  // Abrir modal para ALTA -> OBSERVACION (causa requerida)
  const abrirModalObservacion = (row) => {
    setModalRow(row);
    setModalMode("OBSERVACION");
    setModalCausa(""); // se exige escribir causa
    setModalOpen(true);
  };

  // Abrir modal para OBSERVACION -> BAJA (causa editable, puede quedar igual)
  const abrirModalBaja = (row) => {
    setModalRow(row);
    setModalMode("BAJA");
    setModalCausa(row?.causa || ""); // pre-cargada, editable
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setModalMode(null);
    setModalRow(null);
    setModalCausa("");
  };

  // Confirmar acción del modal
  const confirmarModal = async () => {
    if (!modalRow || !modalMode) return;

    try {
      setGuardandoEstado(true);

      if (modalMode === "OBSERVACION") {
        // causa requerida
        if (!modalCausa.trim()) {
          alert("Debes especificar una causa para pasar a OBSERVACIÓN.");
          return;
        }
        await window.api.post(`/api/inventario/identificados/${modalRow.ident_id}/estado`, {
          estado: "OBSERVACION",
          causa: modalCausa.trim()
        });

        // actualizar optimista
        setIdentificados((prev) =>
          prev.map((it) =>
            it.ident_id === modalRow.ident_id
              ? { ...it, estado_ident: "OBSERVACION", causa: modalCausa.trim() }
              : it
          )
        );
      }

      if (modalMode === "BAJA") {
        console.log("Entre en BAJA")
        // Si no hay causa previa y no se escribió nada, no permitir
        const causaFinal =
          modalCausa?.trim() || modalRow?.causa?.trim() || "";

        // Si el usuario cambió la causa, viaja actualizada; si no, puede omitirse y el server conserva la previa.
        const payload =
          modalCausa?.trim() && modalCausa.trim() !== (modalRow.causa || "").trim()
            ? { estado: "BAJA", causa: modalCausa.trim() }
            : { estado: "BAJA" };

        await window.api.post(`/api/inventario/identificados/${modalRow.ident_id}/estado`, payload);

        setIdentificados((prev) =>
          prev.map((it) =>
            it.ident_id === modalRow.ident_id
              ? { ...it, estado_ident: "BAJA", causa: causaFinal }
              : it
          )
        );
      }

      cerrarModal();
    } catch (err) {
  console.error(err);
  const msg = err?.error || err?.message || 'Error inesperado';
  alert(msg);   
} finally {
      setGuardandoEstado(false);
    }
  };

  // Botón “Modificar estado” según estado actual
  const BotonModificarEstado = ({ row }) => {
    const estado = row?.estado_ident;
    if (estado === "ALTA") {
      return (
        <ActionButton disabled={guardandoEstado} onClick={() => abrirModalObservacion(row)}>
          Modificar estado
        </ActionButton>
      );
    }
    if (estado === "OBSERVACION") {
      return (
        <DangerButton disabled={guardandoEstado} onClick={() => abrirModalBaja(row)}>
          Modificar estado
        </DangerButton>
      );
    }
    return <MutedButton disabled>Modificar estado</MutedButton>; // BAJA u otro
  };

  return (
    <Container>
      <Title>Bienes Identificados</Title>
      <SubTitle>{articuloNombre ? ` ${articuloNombre}` : ""}</SubTitle>

      <ControlsRow>
        <LeftControls>
          <BackButton onClick={() => navigate(-1)}>← Volver</BackButton>
          <Select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="TODOS">Todos</option>
            <option value="ALTA">Alta</option>
            <option value="OBSERVACION">Observación</option>
            <option value="BAJA">Baja</option>
          </Select>
        </LeftControls>
        <RightControls>
          <SearchInput
            placeholder="Buscar por código, ubicación o destino…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar"
          />
        </RightControls>
      </ControlsRow>

      {error && <ErrorText>{error}</ErrorText>}

      <TableWrapper>
        <Table>
          <Thead>
            <Tr>
              <Th>Código</Th>
              <Th>Ubicación</Th>
              <Th>Estado</Th>
              <Th>Causa</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <tbody>
            {cargando ? (
              <Tr><Td colSpan="5" style={{ textAlign: "center", padding: "1rem" }}>Cargando…</Td></Tr>
            ) : dataFiltrada.length === 0 ? (
              <Tr>
                <Td colSpan="5" style={{ textAlign: "center", padding: "1rem", color: "#999" }}>
                  Sin resultados
                </Td>
              </Tr>
            ) : (
              dataFiltrada.map((row) => (
                <React.Fragment key={row.ident_id}>
                  <Tr>
                    <Td>{row?.codigo || "—"}</Td>
                    <Td>{row?.ubicacion_actual?.nombre || "—"}</Td>
                    <Td>
                      <EstadoPill estado={row?.estado_ident}>
                        {row?.estado_ident || "—"}
                      </EstadoPill>
                    </Td>
                    <Td>{row?.causa || "—"}</Td>
                    <Td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <ActionButton onClick={() => toggleExpand(row.ident_id)}>
                        {expand[row.ident_id] ? "Ocultar historial" : "Historial"}
                      </ActionButton>
                      <BotonModificarEstado row={row} />
                    </Td>
                  </Tr>

                  {expand[row.ident_id] && (
                    <Tr>
                      <Td colSpan="5">
                        <SubTable>
                          <thead>
                            <SubTr>
                              <SubTh>Orden</SubTh>
                              <SubTh>Fecha</SubTh>
                              <SubTh>Destino</SubTh>
                              <SubTh>Estado</SubTh>
                            </SubTr>
                          </thead>
                          <tbody>
                            {Array.isArray(row?.ordenes) && row.ordenes.length > 0 ? (
                              row.ordenes.map((o) => (
                                <SubTr key={`${row.ident_id}-${o.orden_id}`}>
                                  <SubTd>{o?.codigo || `#${o?.orden_id}`}</SubTd>
                                  <SubTd>{o?.fecha || "—"}</SubTd>
                                  <SubTd>{o?.destino || "—"}</SubTd>
                                  <SubTd>{o?.estado || "—"}</SubTd>
                                </SubTr>
                              ))
                            ) : (
                              <SubTr>
                                <SubTd colSpan="4" style={{ color: "#999" }}>
                                  Sin órdenes registradas
                                </SubTd>
                              </SubTr>
                            )}
                          </tbody>
                        </SubTable>
                      </Td>
                    </Tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {/* Modal unificado: causa para OBSERVACION y BAJA */}
      {modalOpen && (
        <ModalOverlay>
          <ModalCard>
            <ModalTitle>
              {modalMode === "OBSERVACION" ? "Pasar a OBSERVACIÓN" : "Confirmar BAJA"}
            </ModalTitle>
            <ModalText>
              {modalMode === "OBSERVACION"
                ? "Debes especificar una causa para pasar el bien a OBSERVACIÓN."
                : "Puedes confirmar la BAJA con la causa actual o editarla."}
            </ModalText>

            <ModalTextarea
              placeholder={modalMode === "OBSERVACION"
                ? "Escribe la causa para OBSERVACIÓN…"
                : "Escribe (o ajusta) la causa de BAJA…"}
              value={modalCausa}
              onChange={(e) => setModalCausa(e.target.value)}
            />

            <ModalActions>
              <BackButton onClick={cerrarModal}>Cancelar</BackButton>
              <DangerButton disabled={guardandoEstado} onClick={confirmarModal}>
                {modalMode === "OBSERVACION" ? "Confirmar observación" : "Confirmar baja"}
              </DangerButton>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </Container>
  );
}
