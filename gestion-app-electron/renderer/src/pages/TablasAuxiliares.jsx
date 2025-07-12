import { useEffect, useState } from "react";
import styled from "styled-components";
import Modal from "../components/Modals/CreateAuxiliares";

export default function TablasAuxiliares() {
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalSetState, setModalSetState] = useState(null);
  const [modalUrl, setModalUrl] = useState("");

  const [proveedores, setProveedores] = useState([]);
  const [edificio, setEdificio] = useState([]);
  const [departamento, setDepartamento] = useState([]);
  const [unidadMedida, setUnidadMedida] = useState([]);
  const [marca, setMarca] = useState([]);
  const [categoria, setCategoria] = useState([]);
  const [ubicacion, setUbicacion] = useState([]);
  const [camposAuto, setCamposAuto] = useState({});
  const [campoIgnorado, setCampoIgnorado] = useState([]);

  const esArrayValido = (data) => Array.isArray(data);

  const fetchData = async (url, setState) => {
    try {
      const response = await window.api.get(`/api/generico/${url}`);
      if (response.error) {
        setError(`Error al cargar ${url}: ${response.error}`);
      } else if (esArrayValido(response.data)) {
        setState(response.data);
      } else {
        setError(`Respuesta inesperada de ${url}`);
        console.error(`Respuesta inesperada de ${url}:`, response.data);
      }
    } catch (err) {
      setError(`Error de conexión con ${url}: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchData("categoria", setCategoria);
    fetchData("proveedor", setProveedores);
    fetchData("unidad_medida", setUnidadMedida);
    fetchData("marca", setMarca);
    fetchData("ubicacion", setUbicacion);
  }, []);

  const openModal = (title, setState, url, camposAuto = {}, camposIgnorados = []) => {
    setModalTitle(title);
    setModalSetState(() => setState);
    setModalUrl(url);
    setCamposAuto(camposAuto);
    setCampoIgnorado(camposIgnorados);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalTitle("");
    setModalSetState(null);
    setModalUrl("");
    setCamposAuto({});
    setCampoIgnorado([]);
  };

  const renderLista = (titulo, items, campo = "nombre") => (
    <>
      <SectionTitle>{titulo}</SectionTitle>
      <ItemList>
        {!Array.isArray(items) || items.length === 0 ? (
          <Item>No hay registros.</Item>
        ) : (
          items.map((item) => (
            <Item key={item.id ?? `${campo}-${item[campo]}`}>
              <Icon>📌</Icon>
              <ItemText>{item[campo] || "[sin valor]"}</ItemText>
            </Item>
          ))
        )}
      </ItemList>
    </>
  );

  return (
    <Container>
      <PageTitle>Tablas auxiliares</PageTitle>

      {error && <MessageError>{error}</MessageError>}
      {mensaje && <MessageSuccess>{mensaje}</MessageSuccess>}

      {renderLista("Categorías", categoria, "nombre")}
      <Button onClick={() => openModal("Categoria", setCategoria, "categoria")}>
        Nueva Categoría
      </Button>

      {renderLista("Unidades de medida", unidadMedida, "abreviatura")}
      <Button onClick={() => openModal("Unidades de medida", setUnidadMedida, "unidad_medida")}>
        Nueva Unidad de medida
      </Button>

      {renderLista("Marcas", marca, "nombre")}
      <Button onClick={() => openModal("Marcas", setMarca, "marca")}>
        Nueva Marca
      </Button>

      {renderLista("Ubicaciones", ubicacion, "nombre")}
      <Button onClick={() => openModal("Ubicación", setUbicacion, "ubicacion")}>
        Nueva Ubicación
      </Button>

      {renderLista("Proveedores", proveedores, "razon_social")}
      <Button onClick={() => openModal("Proveedor", setProveedores, "proveedor", ["estado"])}>
        Nuevo Proveedor
      </Button>

      {renderLista("Edificios", edificio, "nombre")}
      <Button onClick={() => openModal("Edificio", setEdificio, "edificio")}>
        Nuevo Edificio
      </Button>

      {renderLista("Departamentos", departamento, "nombre")}
      <Button onClick={() => openModal("Departamento", setDepartamento, "departamento")}>
        Nuevo Departamento
      </Button>

      <BackLink href="/home">Volver atrás</BackLink>

      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          title={`Crear ${modalTitle}`}
          onClose={closeModal}
          setState={modalSetState}
          url={modalUrl}
          campos_auto={camposAuto}
          campo_ignorado={campoIgnorado}
        />
      )}
    </Container>
  );
}

// Styled Components

const Container = styled.div`
  max-width: 900px;
  margin: 40px auto;
  padding: 0 24px 60px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const PageTitle = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 30px;
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  color: #34495e;
  margin-top: 40px;
  margin-bottom: 15px;
  border-bottom: 2px solid #357edd;
  padding-bottom: 6px;
  font-weight: 600;
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  background-color: #f4f8ff;
  border: 1px solid #d0dffb;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.95rem;
  color: #34495e;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.05);
`;

const Icon = styled.span`
  margin-right: 10px;
  font-size: 1.2rem;
`;

const ItemText = styled.span`
  flex-grow: 1;
`;

const Button = styled.button`
  margin-top: 10px;
  padding: 10px 22px;
  background-color: #357edd;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: background-color 0.25s ease;

  &:hover {
    background-color: #285bb5;
  }
`;

const BackLink = styled.a`
  display: inline-block;
  margin-top: 35px;
  font-size: 1rem;
  color: #357edd;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const MessageError = styled.p`
  color: #e74c3c;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
  font-size: 0.9rem;
`;

const MessageSuccess = styled.p`
  color: #2ecc71;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
  font-size: 0.9rem;
`;
