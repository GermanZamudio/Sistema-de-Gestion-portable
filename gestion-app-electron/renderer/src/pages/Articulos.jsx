import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ModalArticle from "../components/Modals/CreateArticle";

const Container = styled.div`
  max-width: 900px;
  margin: 20px auto;
  padding: 0 20px;
`;

const Title = styled.h1`
  margin-bottom: 20px;
  text-align: center;
`;

const ButtonNew = styled.button`
  margin-bottom: 20px;
  padding: 10px 15px;
  background-color: #2980b9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #1f6391;
  }
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ListItem = styled.li`
  display: flex;
  gap: 20px;
  padding: 15px 20px;
  border-bottom: 1px solid #ecf0f1;
  background-color: #fafafa;
  align-items: center;

  &:hover {
    background-color: #f0f8ff;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ItemImage = styled.img`
  width: 100px;
  height: auto;
  border-radius: 6px;
  object-fit: contain;
  border: 1px solid #ccc;
`;

const ItemInfo = styled.div`
  flex: 1;
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const ItemName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
`;

const ItemCode = styled.span`
  color: #7f8c8d;
  font-size: 0.9rem;
`;

const ItemDescription = styled.p`
  margin: 0 0 10px 0;
  color: #34495e;
`;

const ItemDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
`;

const Detail = styled.div`
  font-size: 0.9rem;
  color: #2d3436;
`;

const ErrorText = styled.p`
  color: red;
  text-align: center;
`;

const BackLink = styled.a`
  display: block;
  margin-top: 30px;
  color: #2980b9;
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

return (
  <Container>
    <Title>Artículos de Stock emitidos</Title>

    <ModalArticle
      isOpen={modalOpen}
      title="Crear artículo"
      onClose={() => setModalOpen(false)}
      setArticulos={setArticulos}
    />

    <ButtonNew onClick={() => setModalOpen(true)}>Nuevo artículo</ButtonNew>

    {error && <ErrorText>{error}</ErrorText>}

    {articulos.length === 0 && !error && <p>No hay artículos para mostrar.</p>}

    {articulos.length > 0 && (
      <List>
        {articulos.map((art) => {
console.log(
  `Artículo: ${art.nombre}, tipo de imagen: ${typeof art.imagen}`,
  art.imagen
);
          return (
            <ListItem key={art.id}>
              {art.imagen ? (
                <ItemImage
                  src={art.imagen}  // Ya tiene prefijo 'data:image/jpeg;base64,'
                  alt={`Imagen de ${art.nombre}`}
                />
              ) : (
                <ItemImage
                  src="https://via.placeholder.com/100?text=Sin+imagen"
                  alt="Sin imagen"
                />
              )}
              <ItemInfo>
                <ItemHeader>
                  <ItemName>{art.nombre}</ItemName>
                  <ItemCode>{art.codigo || "-"}</ItemCode>
                </ItemHeader>
                <ItemDescription>{art.descripcion || "Sin descripción"}</ItemDescription>
                <ItemDetails>
                  <Detail>
                    <strong>Precio:</strong> ${formatPrecio(art.precio)}
                  </Detail>
                  <Detail>
                    <strong>Número de Serie:</strong> {art.numero_serie || "-"}
                  </Detail>
                  <Detail>
                    <strong>Identificable:</strong> {art.identificable ? "Sí" : "No"}
                  </Detail>
                  <Detail>
                    <strong>Tipo de Bien:</strong> {art.tipo_bien}
                  </Detail>
                </ItemDetails>
              </ItemInfo>
            </ListItem>
          );
        })}
      </List>
    )}

    <BackLink href="/home">Volver atrás</BackLink>
  </Container>
);

}
