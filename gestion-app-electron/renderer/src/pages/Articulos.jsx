import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import ModalArticle from "../components/Modals/CreateArticle";

const Container = styled.div`
  max-width: 1100px;
  margin: 30px auto;
  padding: 0 24px;
  font-family: 'Inter', sans-serif;
`;

const Title = styled.p`
  font-size: 1.8rem;
  margin-bottom: 1.2rem;
  font-weight: 600;
`;

const CreateButton = styled.button`
  background-color: #28a745;
  color: white;
  padding: 8px 12px;
  font-size: 0.85rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background-color: #218838;
  }
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  width: 100%;
  max-width: 350px;
  font-size: 0.85rem;
  border: 1px solid #ccc;
  border-radius: 8px;

  &::placeholder {
    color: #aaa;
  }
`;

const ContainerHeader = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

const TableWrapper = styled.div`
  max-height: 400px;
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

  &:first-child {
    border-top: none;
  }

  &:hover {
    background-color: #f9f9f9;
  }
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

const Img = styled.img`
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 6px;
  border: 1px solid #e2e2e2;
`;

const ErrorText = styled.p`
  color: red;
  font-size: 0.85rem;
  margin-top: 12px;
  text-align: center;
`;

const BackLink = styled.a`
  display: block;
  margin-top: 30px;
  color: #1a936f;
  text-decoration: none;
  font-weight: 600;
  text-align: center;

  &:hover {
    text-decoration: underline;
  }
`;

export default function Articulos() {
  const [articulos, setArticulos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function fetchArticulos() {
      try {
        const response = await window.api.get("/api/generico/articulo");
        if (response.error) {
          setError(response.error);
          setArticulos([]);
        } else if (Array.isArray(response.data)) {
          setArticulos(response.data);
          setError("");
        } else {
          setError("Datos recibidos no son un arreglo.");
          setArticulos([]);
        }
      } catch (err) {
        setError("Error al cargar artículos");
        setArticulos([]);
      }
    }
    fetchArticulos();
  }, []);

  const filtro = busqueda.toLowerCase();

  const articulosFiltrados = useMemo(() => {
    return articulos.filter((art) => {
      const texto = `${art.nombre} ${art.descripcion} ${art.codigo}`.toLowerCase();
      return texto.includes(filtro);
    });
  }, [articulos, filtro]);

  const formatPrecio = (precio) => (precio == null ? "0.00" : Number(precio).toFixed(2));

  return (
    <Container>
      <Title>Artículos creados</Title>

      {/* Modal original */}
      <ModalArticle
        isOpen={modalOpen}
        title="Crear artículo"
        onClose={() => setModalOpen(false)}
        setArticulos={setArticulos}
      />

      <ContainerHeader>
        <CreateButton onClick={() => setModalOpen(true)}>+ Nuevo artículo</CreateButton>
        <SearchInput
          type="text"
          placeholder="Buscar por nombre, código o descripción"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </ContainerHeader>

      {error && <ErrorText>{error}</ErrorText>}

      {!error && (
        <TableWrapper>
          <Table>
            <Thead>
              <Tr>
                <Th>Imagen</Th>
                <Th>Nombre</Th>
                <Th>Código</Th>
                <Th>Descripción</Th>
                <Th>Precio</Th>
                <Th>Identificable</Th>
                <Th>Tipo</Th>
              </Tr>
            </Thead>
            <tbody>
              {articulosFiltrados.length === 0 ? (
                <Tr>
                  <Td colSpan="7" style={{ textAlign: "center", padding: "1rem", color: "#999" }}>
                    No hay artículos que coincidan con la búsqueda.
                  </Td>
                </Tr>
              ) : (
                articulosFiltrados.map((art) => (
                  <Tr key={art.id}>
                    <Td>
                      <Img
                        src={art.imagen || "https://via.placeholder.com/60?text=Sin+imagen"}
                        alt={art.nombre}
                      />
                    </Td>
                    <Td>{art.nombre}</Td>
                    <Td>{art.codigo || "-"}</Td>
                    <Td>{art.descripcion || "-"}</Td>
                    <Td>${formatPrecio(art.precio)}</Td>
                    <Td>{art.identificable ? "Sí" : "No"}</Td>
                    <Td>{art.tipo_bien || "-"}</Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </TableWrapper>
      )}

      <BackLink href="/home">← Volver atrás</BackLink>
    </Container>
  );
}
