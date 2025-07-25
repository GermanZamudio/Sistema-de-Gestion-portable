import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ModalArticle from "../components/Modals/CreateArticle";

const Container = styled.div`
  max-width: 1000px;
  margin: 30px auto;
  padding: 0 20px;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 20px;
`;

const ButtonNew = styled.button`
  background-color: #1a936f;
  color: white;
  font-weight: 500;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 20px;

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
  padding: 10px;
  font-size: 0.95rem;
  border: 1px solid #dcdcdc;
  border-radius: 8px;
  width: 300px;
  outline: none;
  color: #333;

  &::placeholder {
    color: #b2b2b2;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);

  th,
  td {
    padding: 14px 16px;
    text-align: left;
    font-size: 0.95rem;
    border-bottom: 1px solid #f0f0f0;
  }

  th {
    background-color: #f9f9f9;
    color: #222;
    font-weight: 600;
  }

  tr:hover {
    background-color: #f8f8f8;
  }
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
  const [modalOpen, setModalOpen] = useState(false);
  const [articulos, setArticulos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");

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

  const formatPrecio = (precio) => {
    if (precio == null) return "0.00";
    return Number(precio).toFixed(2);
  };

  const filtrados = articulos.filter((a) => {
    const texto = `${a.nombre} ${a.descripcion} ${a.codigo}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <Container>
      <Title>Artículos de Stock</Title>

      <ModalArticle
        isOpen={modalOpen}
        title="Crear artículo"
        onClose={() => setModalOpen(false)}
        setArticulos={setArticulos}
      />

      <ButtonNew onClick={() => setModalOpen(true)}>+ Nuevo artículo</ButtonNew>

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

          <Table>
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Código</th>
                <th>Descripción</th>
                <th>Precio</th>
                <th>Identificable</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((art) => (
                <tr key={art.id}>
                  <td>
                    <Img
                      src={
                        art.imagen ||
                        "https://via.placeholder.com/60?text=Sin+imagen"
                      }
                      alt={art.nombre}
                    />
                  </td>
                  <td>{art.nombre}</td>
                  <td>{art.codigo || "-"}</td>
                  <td>{art.descripcion || "-"}</td>
                  <td>${formatPrecio(art.precio)}</td>
                  <td>{art.identificable ? "Sí" : "No"}</td>
                  <td>{art.tipo_bien || "-"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      {filtrados.length === 0 && !error && (
        <p>No hay artículos para mostrar.</p>
      )}

      <BackLink href="/home">Volver atrás</BackLink>
    </Container>
  );
}
