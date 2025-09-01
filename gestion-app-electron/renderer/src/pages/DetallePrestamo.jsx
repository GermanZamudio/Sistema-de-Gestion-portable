import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import styled from "styled-components";
import Select from "react-select";

export default function DetallePrestamo() {
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ordenCerrada, setOrdenCerrada] = useState(false);
  const [prestamo, setPrestamo] = useState({});
  const [herramientas, setHerramientas] = useState([]);
  const [cantidadParcial, setCantidadParcial] = useState({});
  const [erroresPorArticulo, setErroresPorArticulo] = useState({});

  const { id } = useParams();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setError("");
    setMensaje("");
    setOrdenCerrada(false);
    try {
      const response = await window.api.get(`/api/inventario/prestamo/${id}`);
      if (response.error) {
        setError(response.error);
      } else {
        setPrestamo(response.prestamo ?? {});
        setHerramientas(Array.isArray(response.articulos_prestados) ? response.articulos_prestados : []);
      }
    } catch (err) {
      console.error(err);
      setError("Error al conectar con el backend.");
    }
  };

  const modificarEntrega = async (item, tipo) => {
    setError("");
    setMensaje("");
    setOrdenCerrada(false);
    setErroresPorArticulo({});

    try {
      let response;
      if (tipo === "parcial") {
        const cantidad = parseInt(cantidadParcial[item.id], 10);
        if (isNaN(cantidad) || cantidad <= 0) {
          setErroresPorArticulo((prev) => ({
            ...prev,
            [item.id]: "Cantidad parcial inválida",
          }));
          return;
        }

        response = await window.api.post("/api/inventario/parcial_pendiente_prestamo", {
          entrega_parcial: {
            id_articulo_en_prestamo: item.id,
            id_articulo: item.articulo_id,
            entregado: cantidad,
          },
        });
      } else if (tipo === "total") {
        response = await window.api.post("/api/inventario/boton_pendiente_prestamo", {
          entrega: {
            id_articulo_prestamo: item.id,
          },
        });
      }

      if (response.error) {
        setErroresPorArticulo((prev) => ({
          ...prev,
          [item.id]: response.error,
        }));
      } else {
        setMensaje(response.message);
        // Mostrar leyenda si la orden fue cerrada
        if (response.prestamo_finalizado) {
          setOrdenCerrada(true);
        } else {
          setOrdenCerrada(false);
        }
        fetchData();
        setCantidadParcial({});
      }
    } catch (err) {
      console.error(err);
      setErroresPorArticulo((prev) => ({
        ...prev,
        [item.id]: "Error inesperado al modificar entrega",
      }));
    }
  };

  const handleCantidadChange = (idArticulo, value) => {
    setCantidadParcial({ ...cantidadParcial, [idArticulo]: value });
  };

  return (
    <Container>
      {mensaje && <MensajeExito>{mensaje}</MensajeExito>}
      {ordenCerrada && <MensajeOrdenCerrada>✅ La orden se cerró correctamente.</MensajeOrdenCerrada>}
      {error && <MensajeError>{error}</MensajeError>}

      <Titulo>Orden de Prestamo: {prestamo?.nombre || "Sin nombre"}</Titulo>
      <Parrafo><strong>Fecha:</strong> {prestamo?.fecha ?? "-"}</Parrafo>
      <Parrafo><strong>Personal encargado:</strong> {prestamo?.autorizado ?? "-"}</Parrafo>

      <Subtitulo>Estado de la orden</Subtitulo>
      <Select
        options={[
          { value: "ACTIVO", label: "Activa" },
          { value: "CULMINADO", label: "Culminada" },
        ]}
        value={{
          value: prestamo.estado,
          label: prestamo.estado === "ACTIVO" ? "Activa" : "Culminada",
        }}
        isDisabled
        styles={customSelectStyles}
      />

      <Subtitulo>Departamento</Subtitulo>
      <Parrafo><strong>Locación:</strong> {prestamo?.locacion ?? "-"}</Parrafo>

      {/* Artículos de Stock */}
      <Subtitulo>Artículos de Stock</Subtitulo>
      {herramientas.filter(item => item.tipo_bien === "HERRAMIENTA").length > 0 ? (
        <Tabla>
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Entregado</th>
              <th>Devuelto</th>
              <th>Cant. a entregar</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {herramientas
              .filter(item => item.tipo_bien === "HERRAMIENTA")
              .map((item, index) => {
                const completado = item.cantidad === item.cantidad_devuelta;
                return (
                  <tr key={item.id ?? index}>
                    <td>{item.nombre}</td>
                    <td>{item.cantidad}</td>
                    <td>{item.cantidad_devuelta}</td>
                    {completado ? (
                      <>
                        <td>-</td>
                        <td><Completado>Completado</Completado></td>
                      </>
                    ) : (
                      <>
                        <td>
                          <div>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={cantidadParcial[item.id] || ""}
                              onChange={(e) => handleCantidadChange(item.id, e.target.value)}
                            />
                            {erroresPorArticulo[item.id] && (
                              <ErrorTexto>{erroresPorArticulo[item.id]}</ErrorTexto>
                            )}
                          </div>
                        </td>
                        <td>
                          <ButtonAzul onClick={() => modificarEntrega(item, "parcial")}>
                            Entrega Parcial
                          </ButtonAzul>
                          <ButtonVerde onClick={() => modificarEntrega(item, "total")}>
                            Entrega Total
                          </ButtonVerde>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </Tabla>
      ) : (
        <Parrafo>No hay herramientas asignadas.</Parrafo>
      )}

      <LinksWrapper>
        <StyledLink to="/lista-prestamo">Volver a Prestamos</StyledLink>
      </LinksWrapper>
    </Container>
  );
}

// ==== Styled Components ====

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

const MensajeOrdenCerrada = styled.p`
  color: #2e7d32;
  font-weight: 700;
  text-align: center;
  margin-bottom: 10px;
  font-size: 15px;
`;

const Completado = styled.span`
  color: #2e7d32;
  background-color: #e8f5e9;
  padding: 5px 10px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 13px;
`;

const MensajeError = styled.p`
  color: red;
  font-weight: 600;
  text-align: center;
  margin-bottom: 10px;
  font-size: 14px;
`;

const ButtonAzul = styled.button`
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  margin-right: 5px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #0d47a1;
  }
`;
const ButtonVerde = styled.button`
  background-color: #2e7d32;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #1b5e20;
  }
`;

const Titulo = styled.h1`
  font-size: 20px;
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

const Input = styled.input`
  width: 60px;
  padding: 4px 6px;
  font-size: 13px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
  transition: border 0.2s ease;

  &:focus {
    border-color: #1976d2;
  }
`;

const ErrorTexto = styled.div`
  color: #d32f2f;
  font-size: 13px;
  margin-top: 4px;
`;
