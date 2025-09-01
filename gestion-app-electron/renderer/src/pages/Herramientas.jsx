import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ModalHerramientas from "../components/Modals/CreateHerramienta";
import ModalArticle from "../components/Modals/CreateArticle";
import AjustarCantidadModal from "../components/Modals/AjustarCantidad";

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

  &:hover {
    background-color: #168765;
  }
`;

const SearchWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
`;

const SearchInput = styled.input`
  padding: 6px 10px;
  font-size: 0.85rem;
  border: 1px solid #dcdcdc;
  border-radius: 6px;
  width: 250px;
  outline: none;
  color: #333;

  &::placeholder {
    color: #b2b2b2;
  }
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

  &:first-child {
    border-top: none;
  }

  &:hover {
    background-color: #f8f8f8;
  }
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
  text-align: center;

  &:hover {
    text-decoration: underline;
  }
`;

export default function Herramientas() {
  const [modalOpen, setModalOpen] = useState(false);
  const [herramientas, setHerramientas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [modalOpen2, setModalOpen2] = useState(false);
  const [ajusteModalOpen, setAjusteModalOpen] = useState(false);
  const [herramientaSeleccionada, setHerramientaSeleccionada] = useState(null);

  const abrirAjusteModal = (herramienta) => {
    setHerramientaSeleccionada(herramienta);
    setAjusteModalOpen(true);
  };

  const confirmarAjuste = async (cantidadAjuste, causa) => {
    try {
      const payload = [
        {
          id: herramientaSeleccionada.id,
          cantidad_existencia: cantidadAjuste,
          causa: causa,
          ubicacion_id: herramientaSeleccionada.existencias[0]?.ubicacion_id ?? 1,
        },
      ];
      const response = await window.api.post("/api/inventario/ajuste-cant-herramienta", {
        articulo: payload,
      });
      if (response?.mensaje) {
        // Refrescar herramientas
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
      } else if (response.error) {
        setError(response.error);
        setHerramientas([]);
      } else {
        setError("Datos recibidos no son un arreglo.");
        setHerramientas([]);
      }
    } catch (err) {
      setError("Error al cargar Herramientas");
      setHerramientas([]);
    }
  };

  useEffect(() => {
    fetchHerramientas();
  }, []);

  const formatPrecio = (precio) => {
    if (precio == null) return "0.00";
    return Number(precio).toFixed(2);
  };

  const filtrados = herramientas.filter((a) => {
    const texto = `${a.nombre} ${a.descripcion} ${a.codigo || ""}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <Container>
      <Title>Herramientas</Title>

      <ModalHerramientas
        isOpen={modalOpen}
        title="Crear herramienta"
        onClose={() => setModalOpen(false)}
        fetchHerramientas={fetchHerramientas}
      />

      <ButtonNew onClick={() => setModalOpen(true)}>+ Nueva herramienta</ButtonNew>

      <ModalArticle
        isOpen={modalOpen2}
        title="Crear artículo"
        onClose={() => setModalOpen2(false)}
      />

      <ButtonNew onClick={() => setModalOpen2(true)}>+ Nuevo artículo</ButtonNew>

      {error && <ErrorText>{error}</ErrorText>}

      {filtrados.length > 0 && (
        <>
          <SearchWrapper>
            <SearchInput
              type="text"
              placeholder="Buscar por nombre, código o descripción"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </SearchWrapper>

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
                    <Td>${formatPrecio(art.precio)}</Td>
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
        </>
      )}

      {filtrados.length === 0 && !error && <p>No hay herramientas para mostrar.</p>}

      <AjustarCantidadModal
        isOpen={ajusteModalOpen}
        onClose={() => setAjusteModalOpen(false)}
        onConfirm={confirmarAjuste}
        articulo={herramientaSeleccionada}
      />

      <BackContainer>
        <BackLink href="/home">← Volver al inicio</BackLink>
      </BackContainer>
    </Container>
  );
}
