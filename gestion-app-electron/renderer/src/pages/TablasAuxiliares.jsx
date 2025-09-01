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
  const [camposAuto, setCamposAuto] = useState({});
  const [campoIgnorado, setCampoIgnorado] = useState([]);

  const [proveedores, setProveedores] = useState([]);
  const [unidadMedida, setUnidadMedida] = useState([]);
  const [marca, setMarca] = useState([]);
  const [categoria, setCategoria] = useState([]);
  const [ubicacion, setUbicacion] = useState([]);

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

  const renderGrupo = (grupoTitulo, listas) => (
    <Grupo>
      <GrupoTitulo>{grupoTitulo}</GrupoTitulo>
      <Grid>
        {listas.map(({ titulo, items, campo, setState, url }) => (
          <Lista key={titulo}>
            <ListaTitulo>
              {titulo}
              <Button onClick={() => openModal(titulo, setState, url)}>+</Button>
            </ListaTitulo>
            <ul>
              {items?.length > 0 ? (
                items.map((item) => (
                  <li key={item.id ?? item[campo]}>
                    <LinkItem>
                      <IconoItem>📘</IconoItem>
                      {item[campo] || "[sin valor]"}
                    </LinkItem>
                  </li>
                ))
              ) : (
                <li>
                  <LinkItem vacío>No hay registros.</LinkItem>
                </li>
              )}
            </ul>
          </Lista>
        ))}
      </Grid>
    </Grupo>
  );

  return (
    <Container>
      <PageTitle>Tablas Auxiliares</PageTitle>

      {error && <MessageError>{error}</MessageError>}
      {mensaje && <MessageSuccess>{mensaje}</MessageSuccess>}

      {renderGrupo("Empleados", [
        { titulo: "Categorías", items: categoria, campo: "nombre", setState: setCategoria, url: "categoria" },
        { titulo: "Unidades de medida", items: unidadMedida, campo: "abreviatura", setState: setUnidadMedida, url: "unidad_medida" },
        { titulo: "Marcas", items: marca, campo: "nombre", setState: setMarca, url: "marca" },
      ])}

      {renderGrupo("Cuentas", [
        { titulo: "Proveedores", items: proveedores, campo: "razon_social", setState: setProveedores, url: "proveedor" },
        { titulo: "Ubicaciones", items: ubicacion, campo: "nombre", setState: setUbicacion, url: "ubicacion" },
      ])}

      <BackLink href="/home">← Volver al inicio</BackLink>

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

// ----------------- Styled Components ------------------

const Container = styled.main`
  max-width: 1000px;
  margin: 50px auto;
  padding: 0 20px;
`;

const PageTitle = styled.p`
  font-size: 2rem;
  text-align: center;
  margin-bottom: 40px;
`;

const Grupo = styled.section`
  margin-bottom: 48px;
`;

const GrupoTitulo = styled.h2`
  font-size: 1.2rem;
  color: #24292f;
  font-weight: 600;
  margin-bottom: 16px;
  border-bottom: 1px solid #d0d7de;
  padding-bottom: 4px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
`;

const Lista = styled.div`
  background: #ffffff;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding: 16px;
  ul {
    list-style: none;  // <-- elimina el punto
    padding-left: 0;
    margin: 0;
  }

  li {
    margin-bottom: 6px;
  }
`;

const ListaTitulo = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #000000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const LinkItem = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  color: #1f6feb;
  margin-bottom: 6px;

  ${({ vacío }) =>
    vacío &&
    `
    color: #57606a;
    font-style: italic;
  `}
`;

const IconoItem = styled.span`
  margin-right: 8px;
`;

const Button = styled.button`
  background: #2da44e;
  border: none;
  color: white;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #218739;
  }
`;

const BackLink = styled.a`
  display: inline-block;
  margin-top: 30px;
  font-size: 1rem;
  color: #0969da;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const MessageError = styled.p`
  color: #cf222e;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
`;

const MessageSuccess = styled.p`
  color: #1a7f37;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
`;
