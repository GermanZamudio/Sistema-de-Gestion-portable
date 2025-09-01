import React, { useState, useEffect } from "react";
import styled from "styled-components";

export default function ModalHerramientas({ isOpen, onClose, fetchHerramientas }) {
  const [relaciones, setRelaciones] = useState({ articulos: [], ubicacion: [] });
  const [articulos, setArticulos] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchForm() {
      try {
        const response = await window.api.get("/api/inventario/form/herramienta");
        if (response.error) {
          setError(response.error);
        } else {
          setRelaciones(
            response.relaciones.reduce((acc, item) => {
              acc[item.nombre] = item.datos;
              return acc;
            }, {})
          );
        }
      } catch (err) {
        setError("Error al cargar datos de relaciones");
        console.error(err);
      }
    }

    fetchForm();
    setArticulos([{ id: "", cantidad_existencia: "", ubicacion_id: "" }]); // reiniciar
  }, [isOpen]);

  const handleChange = (index, field, value) => {
    const newArticulos = [...articulos];
    newArticulos[index][field] = value;
    setArticulos(newArticulos);
  };

  const handleAgregarOtro = () => {
    setArticulos([...articulos, { id: "", cantidad_existencia: "", ubicacion_id: "" }]);
  };

  const handleSubmit = async () => {
    const valid = articulos.every(a =>
      a.id && a.cantidad_existencia && a.ubicacion_id
    );

    if (!valid) {
      return setError("Todos los campos son obligatorios en cada artículo.");
    }

    setLoading(true);
    setError("");

    try {
      const res = await window.api.post("/api/inventario/herramienta/", {
        articulo: articulos
      });

      if (res.error) {
        setError(res.error);
      } else {
        onClose();
        await fetchHerramientas();
        
      }
    } catch (err) {
      console.error(err);
      setError("Error al guardar herramientas.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay>
      <ModalContainer>
        <Header>
          <Title>Agregar Herramientas</Title>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </Header>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        {articulos.map((articulo, index) => (
          <ArticuloForm key={index}>
            <InputGroup>
              <label>Artículo:</label>
              <select
                value={articulo.id}
                onChange={(e) => handleChange(index, "id", e.target.value)}
              >
                <option value="">Seleccione</option>
                {relaciones.articulos.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </InputGroup>

            <InputGroup>
              <label>Cantidad en existencia:</label>
              <input
                type="number"
                value={articulo.cantidad_existencia}
                onChange={(e) => handleChange(index, "cantidad_existencia", e.target.value)}
              />
            </InputGroup>

            <InputGroup>
              <label>Ubicación:</label>
              <select
                value={articulo.ubicacion_id}
                onChange={(e) => handleChange(index, "ubicacion_id", e.target.value)}
              >
                <option value="">Seleccione</option>
                {relaciones.ubicacion.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
            </InputGroup>
          </ArticuloForm>
        ))}

        <Footer>
          <AgregarOtro type="button" onClick={handleAgregarOtro}>+ Agregar otro artículo</AgregarOtro>
          <CancelButton onClick={onClose}>Cancelar</CancelButton>
          <SubmitButton onClick={handleSubmit} disabled={loading}>
            {loading ? "Guardando..." : "Guardar todos"}
          </SubmitButton>
        </Footer>
      </ModalContainer>
    </Overlay>
  );
}

// Estilos styled-components (igual que antes)
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;
const ModalContainer = styled.div`
  background: white;
  width: 40%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
  border-radius: 8px;
`;
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const Title = styled.h2``;
const CloseButton = styled.button`
  font-size: 1.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
`;
const ErrorMsg = styled.p`
  color: red;
  margin: 1rem 0;
`;
const InputGroup = styled.div`
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
`;
const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;
const CancelButton = styled.button`
  background: #bbb;
  color: white;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 4px;
`;
const SubmitButton = styled.button`
  background: #4caf50;
  color: white;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 4px;
`;
const ArticuloForm = styled.div`
  border: 1px solid #ccc;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 5px;
`;

const AgregarOtro = styled.button`
  background: #1976d2;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  margin-right: auto;
`;
