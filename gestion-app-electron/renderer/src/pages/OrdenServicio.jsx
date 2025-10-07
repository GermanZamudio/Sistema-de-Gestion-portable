import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import Select from "react-select";
import { exportOrdenServicioToPDF } from "../utils/exportOrdenServicioPdf";
import ModalDeleteOrden from "../components/Modals/DeleteOrden";
import ModalAsigando from "../components/Modals/CreateAsignado";

export default function OrdenServicio() {
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalArtOpen, setModalArtOpen] = useState(false);
  const [modalIdentOpen, setModalIdentOpen] = useState(false);
  const [modalSobranteOpen, setModalSobranteOpen] = useState(false);
  const [modalTipoAsignar, setModalTipoAsignar] = useState(""); // Nuevo estado para tipo
  const [guardandoIdent, setGuardandoIdent] = useState(false);

  const [ordenServicio, setOrdenServicio] = useState({});
  const [edificio, setEdificio] = useState({});
  const [articulos, setArticulos] = useState([]);
  const [identificados, setIdentificados] = useState([]);
  const [sobrantes, setSobrantes] = useState([]);
  const { id } = useParams();

  const onExportarPDF = () => {
    exportOrdenServicioToPDF({
      orden: ordenServicio,
      edificio,
      articulos,
      identificados,
      sobrantes,
      fileName: `orden_${ordenServicio?.id ?? "servicio"}.pdf`,
    });
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setError("");
    setMensaje("");
    try {
      const response = await window.api.get(`/api/orden_servicio/${id}`);
      if (response.error) {
        setError(response.error);
      } else {
        setOrdenServicio(response.orden ?? {});
        setArticulos(Array.isArray(response.articulos_asignados) ? response.articulos_asignados : []);
        setSobrantes(Array.isArray(response.sobrantes_de_obra) ? response.sobrantes_de_obra : []);
        setIdentificados(Array.isArray(response.articulos_asignados_identificados) ? response.articulos_asignados_identificados : []);
        setEdificio(response.edificio ?? {});
      }
    } catch {
      setError("Error al conectar con el backend.");
    }
  };
  
  const ModificarEntrega = async (asignadoIdentId) => {
    
    console.log("Fui clickeado, el id es: ",asignadoIdentId)
    if (!asignadoIdentId) return;

    setError("");
    setMensaje("");
    setGuardandoIdent(true);
    console.log("Pase el primer if")
    try {
      const resp = await window.api.post(
        `/api/orden_servicio/identificados/${asignadoIdentId}/entregar`,
        { estado: "ENTREGADO" }
      );


      if (resp?.error) {
        setError(resp.error || "No se pudo completar la entrega.");
        return;
      }

      // Actualización optimista en UI
      setIdentificados((prev) =>
        prev.map((it) =>
          it.id === asignadoIdentId ? { ...it, estado: "ENTREGADO" } : it
        )
      );

      setMensaje("Artículo identificado entregado correctamente.");
      // Si querés refrescar todo desde el backend:
      // await fetchData();
    } catch (e) {
      setError(e?.message || "Error al entregar el artículo identificado.");
    } finally {
      setGuardandoIdent(false);
    }
  };

  const addEntrega = async (articuloId) => {
    setError("");
    setMensaje("");
    try {
      const response = await window.api.post(`/api/modificar_articulos_asignados/${articuloId}`, { cant_entregada: 1 });
      if (response.error) {
        setError(response.error);
      } else {
        setMensaje("Se modificó correctamente la entrega");
        await fetchData();
      }
    } catch {
      setError("Error al modificar la entrega");
    }
  };

  const removeEntrega = async (articuloId) => {
    setError("");
    setMensaje("");
    try {
      const response = await window.api.post(`/api/modificar_articulos_asignados/${articuloId}`, { cant_entregada: -1 });
      if (response.error) {
        setError(response.error);
      } else {
        setMensaje("Se modificó correctamente la entrega");
        await fetchData();
      }
    } catch {
      setError("Error al modificar la entrega");
    }
  };

  const handleReopen = async (ordenId) => {
    if (!ordenId) return;
    setError("");
    setMensaje("");
    try {
      const response = await window.api.post(`/api/reabrir_orden_servicio/${ordenId}`);
      if (response.error) {
        setError(response.error);
      } else {
        setMensaje("La orden se reabrió correctamente");
        await fetchData();
      }
    } catch {
      setError("Error al reabrir la orden");
    }
  };

  const hayIdentificadosCulminados = identificados.some(item => item.estado === "CULMINADO");

  // Función para abrir modal con tipo
  const abrirModalAsignar = (tipo) => {
    setModalTipoAsignar(tipo);
    setModalArtOpen(true);
  };

  return (
    <Container>
      {modalOpen && ordenServicio.id && (
        <ModalDeleteOrden
          isOpen={modalOpen}
          title="Cerrar Orden de servicio"
          onClose={() => setModalOpen(false)}
          id={ordenServicio.id}
        />
      )}

      <ModalAsigando
        isOpen={modalArtOpen}
        title={`Asignar nuevo ${modalTipoAsignar === "stock" ? "artículo" : modalTipoAsignar === "uso" ? "bien de uso" : modalTipoAsignar === "consumo" ? "bien de consumo" : ""}`}
        onClose={() => setModalArtOpen(false)}
        setState={setArticulos}
        id={ordenServicio?.id}
        tipo={modalTipoAsignar}
      />

      <ModalAsigando
        isOpen={modalIdentOpen}
        title="Asignar artículo identificado"
        onClose={() => setModalIdentOpen(false)}
        setState={setIdentificados}
        id={ordenServicio?.id}
        tipo="identificado"
      />

      <ModalAsigando
        isOpen={modalSobranteOpen}
        title="Asignar sobrante"
        onClose={() => setModalSobranteOpen(false)}
        setState={setSobrantes}
        id={ordenServicio?.id}
        tipo="asignar_sobrante"
      />

      {mensaje && <MensajeExito>{mensaje}</MensajeExito>}
      {error && <MensajeError>{error}</MensajeError>}

      {ordenServicio.imagen && <ImagenOrden src={ordenServicio.imagen} alt={`Imagen de ${ordenServicio.nombre}`} />}

      <Titulo>Orden de Servicio: {ordenServicio?.nombre ?? "Sin nombre"}</Titulo>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <Button onClick={onExportarPDF}>Exportar PDF</Button>
      </div>

      <Parrafo><strong>Fecha:</strong> {ordenServicio?.fecha ?? "-"}</Parrafo>
      <Parrafo><strong>Descripción:</strong> {ordenServicio?.descripcion ?? "-"}</Parrafo>
      <Parrafo><strong>Personal encargado:</strong> {ordenServicio?.responsable ?? "-"}</Parrafo>

      <Subtitulo>Estado de la orden</Subtitulo>
      <Select
        options={[
          { value: "ACTIVO", label: "Activa" },
          { value: "CULMINADO", label: "Culminada" },
        ]}
        value={{
          value: ordenServicio.estado,
          label: ordenServicio.estado === "ACTIVO" ? "Activa" : "Culminada",
        }}
        isDisabled
        styles={customSelectStyles}
      />

      <Subtitulo>Departamento</Subtitulo>
      <Parrafo><strong>Edificio:</strong> {edificio?.nombre_edificio ?? "-"}</Parrafo>
      <Parrafo><strong>Número:</strong> {edificio?.numero ?? "-"}</Parrafo>
      <Parrafo><strong>Piso:</strong> {edificio?.piso ?? "-"}</Parrafo>

      {/* Artículos de Stock */}
      <Subtitulo>Artículos de Stock</Subtitulo>
      {ordenServicio.estado !== "CULMINADO" && (
        <ButtonNew onClick={() => abrirModalAsignar("stock")}>Asignar nuevo artículo</ButtonNew>
      )}
      {articulos.filter(item => item.tipo_bien === "STOCK").length > 0 ? (
        <Tabla>
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Asignado</th>
              <th>Entregado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {articulos
              .filter(item => item.tipo_bien === "STOCK")
              .map((item, index) => {
                const maxReached = item.cantidad_entregada >= item.cantidad_asignada;
                const minReached = item.cantidad_entregada <= 0;

                return (
                  <tr key={item.id ?? index}>
                    <td>{item.nombre}</td>
                    <td>{item.cantidad_asignada}</td>
                    <td>{item.cantidad_entregada}</td>
                    <td>
                      {ordenServicio.estado !== "CULMINADO" && item.estado !== "CULMINADO" && (
                        <>
                          <Button small onClick={() => addEntrega(item.id)} disabled={maxReached}>+</Button>
                          <Button small onClick={() => removeEntrega(item.id)} disabled={minReached}>−</Button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Tabla>
      ) : (
        <Parrafo>No hay artículos asignados.</Parrafo>
      )}
      {/* Bienes de Uso */}
      <Subtitulo>Bienes de Uso</Subtitulo>
      {ordenServicio.estado !== "CULMINADO" && (
        <ButtonNew onClick={() => abrirModalAsignar("uso")}>Asignar nuevo bien de uso</ButtonNew>
      )}
      {articulos.filter(item => item.tipo_bien === "USO").length > 0 ? (
        <Tabla>
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Asignado</th>
              <th>Entregado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {articulos
              .filter(item => item.tipo_bien === "USO")
              .map((item, index) => {
                const maxReached = item.cantidad_entregada >= item.cantidad_asignada;
                const minReached = item.cantidad_entregada <= 0;

                return (
                  <tr key={item.id ?? index}>
                    <td>{item.nombre}</td>
                    <td>{item.cantidad_asignada}</td>
                    <td>{item.cantidad_entregada}</td>
                    <td>
                      {ordenServicio.estado !== "CULMINADO" && item.estado !== "CULMINADO" && (
                        <>
                          <Button small onClick={() => addEntrega(item.id)} disabled={maxReached}>+</Button>
                          <Button small onClick={() => removeEntrega(item.id)} disabled={minReached}>−</Button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Tabla>
      ) : (
        <Parrafo>No hay bienes de uso asignados.</Parrafo>
      )}

      {/* Bienes de Consumo */}
      <Subtitulo>Bienes de Consumo</Subtitulo>
      {ordenServicio.estado !== "CULMINADO" && (
        <ButtonNew onClick={() => abrirModalAsignar("consumo")}>Asignar nuevo bien de consumo</ButtonNew>
      )}
      {articulos.filter(item => item.tipo_bien === "CONSUMO").length > 0 ? (
        <Tabla>
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Asignado</th>
              <th>Entregado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {articulos
              .filter(item => item.tipo_bien === "CONSUMO")
              .map((item, index) => {
                const maxReached = item.cantidad_entregada >= item.cantidad_asignada;
                const minReached = item.cantidad_entregada <= 0;

                return (
                  <tr key={item.id ?? index}>
                    <td>{item.nombre}</td>
                    <td>{item.cantidad_asignada}</td>
                    <td>{item.cantidad_entregada}</td>
                    <td>
                      {ordenServicio.estado !== "CULMINADO" && item.estado !== "CULMINADO" && (
                        <>
                          <Button small onClick={() => addEntrega(item.id)} disabled={maxReached}>+</Button>
                          <Button small onClick={() => removeEntrega(item.id)} disabled={minReached}>−</Button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Tabla>
      ) : (
        <Parrafo>No hay bienes de consumo asignados.</Parrafo>
      )}


      <Subtitulo>Artículos Identificados Asignados</Subtitulo>
      {ordenServicio.estado !== "CULMINADO" && (
        <ButtonNew onClick={() => setModalIdentOpen(true)}>Asignar nuevo artículo identificado</ButtonNew>
      )}
      {identificados.length > 0 ? (
        <Lista>
          {identificados.map((item, index) => (
            <li key={item.id ?? index}>
              {item.nombre_articulo} - Código: {item.codigo} - Estado: {item.estado}            
              
              {item.estado === "ASIGNADO" && (
                <ButtonEstadoEntrega
                  disabled={guardandoIdent}
                  onClick={() => ModificarEntrega(item.id)}
                >
                  Entregar
                </ButtonEstadoEntrega>
              )}
            </li>

          ))}
        </Lista>
      ) : (
        <Parrafo>No hay artículos identificados asignados.</Parrafo>
      )}

      <Subtitulo>Sobrantes Utilizados</Subtitulo>
      {ordenServicio.estado !== "CULMINADO" && (
        <ButtonNew onClick={() => setModalSobranteOpen(true)}>Asignar nuevo sobrante</ButtonNew>
      )}
      {sobrantes.length > 0 ? (
        <Lista>
          {sobrantes.map((item, index) => (
            <li key={item.id ?? index}>
              {item.nombre} - Cantidad utilizada: {item.cantidad}
            </li>
          ))}
        </Lista>
      ) : (
        <Parrafo>No hay sobrantes utilizados.</Parrafo>
      )}

      {ordenServicio.estado !== "CULMINADO" && !hayIdentificadosCulminados && (
        <Button onClick={() => setModalOpen(true)}>Cerrar Orden de Trabajo</Button>
      )}

      {ordenServicio.estado === "CULMINADO" && (
        <Button onClick={() => handleReopen(ordenServicio.id)}>Reabrir Orden de Trabajo</Button>
      )}

      <LinksWrapper>
        <StyledLink to="/lista-ordenes-servicio">Volver a órdenes de servicio</StyledLink>
      </LinksWrapper>
    </Container>
  );
}

// ==== Styled Components ====
// (Igual que tu código anterior...)

const Container = styled.div`
  max-width: 700px;
  margin: 20px auto;
  padding: 0 10px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const MensajeExito = styled.p`
  color: green;
  font-weight: 600;
  text-align: center;
  margin-bottom: 10px;
  font-size: 14px;
`;

const MensajeError = styled.p`
  color: red;
  font-weight: 600;
  text-align: center;
  margin-bottom: 10px;
  font-size: 14px;
`;

const ImagenOrden = styled.img`
  display: block;
  max-width: 220px;
  max-height: 180px;
  margin: 0 auto 15px auto;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0,0,0,0.15);
  object-fit: contain;
`;

const Titulo = styled.h1`
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 10px;
`;

const Subtitulo = styled.h2`
  font-size: 16px;
  margin-top: 20px;
  margin-bottom: 8px;
  border-bottom: 1px solid #357edd;
  padding-bottom: 2px;
`;

const Parrafo = styled.p`
  font-size: 14px;
  margin: 4px 0;
`;

const Tabla = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  margin-bottom: 20px;

  th, td {
    padding: 6px 8px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  th {
    background-color: #f2f2f2;
    font-weight: 600;
  }

  td button {
    margin-right: 5px;
  }
`;

const Button = styled.button`
  background-color: #357edd;
  color: white;
  border: none;
  border-radius: ${(props) => (props.small ? "3px" : "5px")};
  padding: ${(props) => (props.small ? "2px 6px" : "6px 10px")};
  font-size: ${(props) => (props.small ? "13px" : "14px")};
  cursor: pointer;
  margin: 0 4px 0 0;
  transition: background-color 0.3s ease;

  &:disabled {
    background-color: #a6c8ff;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: #285bb5;
  }
`;

const ButtonEstadoEntrega = styled.button`
  background-color: #357edd;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 6px 10px;
  font-size: 14px;
  cursor: pointer;
  margin-left: 8px;        // ⇦ espacio respecto al texto
  transition: background-color 0.3s ease;

  &:disabled {
    background-color: #a6c8ff;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: #285bb5;
  }
`;

const ButtonNew = styled.button`
  margin-bottom: 15px;
  padding: 6px 10px;
  background-color: #e67e22;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #d35400;
  }
`;

const Lista = styled.ul`
  padding-left: 15px;
  font-size: 14px;
  margin-bottom: 15px;
  display: flex;

  li {
    margin-bottom: 4px;
  }
`;

const LinksWrapper = styled.div`
  margin-top: 20px;
  text-align: center;

`;

const StyledLink = styled(Link)`
  color: #357edd;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
`;

// Select personalizado
const customSelectStyles = {
  control: (provided) => ({
    ...provided,
    borderColor: "#ccc",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#357edd",
    },
    fontSize: "14px",
    minHeight: "30px",
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "14px",
    backgroundColor: state.isSelected
      ? "#357edd"
      : state.isFocused
      ? "#f0f8ff"
      : "#fff",
    color: state.isSelected ? "white" : "black",
    padding: 6,
  }),
  singleValue: (provided) => ({
    ...provided,
    fontWeight: 500,
    fontSize: "14px",
  }),
};
