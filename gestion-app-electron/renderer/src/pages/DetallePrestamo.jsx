import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import Select from "react-select";


export default function DetallePrestamo() {
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [prestamo, setPrestamo] = useState({});
  const [herramientas, setHerramientas] = useState([]);
  const { id } = useParams();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setError("");
    setMensaje("");
    try {
      const response = await window.api.get(`/api/inventario/prestamo/${id}`);
      if (response.error) {
        setError(response.error);
      } else {
        setPrestamo(response.prestamo ?? {});
        setHerramientas(Array.isArray(response.articulos_prestados) ? response.articulos_prestados : []);
      }
    } catch {
      setError("Error al conectar con el backend.");
    }
  };




  return (
    <Container>
      {mensaje && <MensajeExito>{mensaje}</MensajeExito>}
      {error && <MensajeError>{error}</MensajeError>}

      <Titulo>Orden de Prestamo: {prestamo?.nombre ?? "Sin nombre"}</Titulo>
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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {herramientas
              .filter(item => item.tipo_bien === "HERRAMIENTA")
              .map((item, index) => {
                return (
                  <tr key={item.id ?? index}>
                    <td>{item.nombre}</td>
                    <td>{item.cantidad}</td>
                    <td>-</td>
                    <td>-</td>
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
