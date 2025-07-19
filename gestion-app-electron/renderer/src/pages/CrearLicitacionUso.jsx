import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";

export default function CrearLicitacionUso() {
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [identificables, setIdentificables] = useState([]);
  const [codigosIdentificados, setCodigosIdentificados] = useState({});

  const [licitacion, setLicitacion] = useState({
    nombre: "",
    año: "",
    articulos: [
      {
        nombre: "",
        descripcion: "",
        codigo: "",
        precio: "",
        numero_serie: "",
        identificable: false,
        tipo_bien: "USO",
        unidad_medida_id: "",
        categoria_id: "",
        marca_id: "",
        ubicacion_id: "",
        cantidad_existencia: "",
      },
    ],
  });

  useEffect(() => {
    async function fetchFormArticulos() {
      const response = await window.api.get("/api/inventario/form_licitacion");
      if (response.error) {
        setError(response.error);
      } else {
        setForm(response);
      }
    }
    fetchFormArticulos();
  }, []);

  const relacionesMap = useMemo(() => {
    if (!form || !form.relaciones) return {};
    const map = {};
    form.relaciones.forEach((r) => {
      map[r.nombre] = r;
    });
    return map;
  }, [form]);

  const handleLicitacionChange = (e) => {
    const { name, value } = e.target;
    setLicitacion((prev) => ({ ...prev, [name]: value }));
  };

  const handleArticuloChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    setLicitacion((prev) => {
      const articulos = [...prev.articulos];
      articulos[index] = {
        ...articulos[index],
        [name]: type === "checkbox" ? checked : value,
      };
      return { ...prev, articulos };
    });
  };

  const agregarArticulo = () => {
    setLicitacion((prev) => ({
      ...prev,
      articulos: [
        ...prev.articulos,
        {
          nombre: "",
          descripcion: "",
          codigo: "",
          precio: "",
          numero_serie: "",
          identificable: false,
          tipo_bien: "USO",
          unidad_medida_id: "",
          categoria_id: "",
          marca_id: "",
          ubicacion_id: "",
          cantidad_existencia: "",
        },
      ],
    }));
  };

  const renderSelect = (index, campo) => {
    const tabla = campo.replace("_id", "");
    const relacion = relacionesMap[tabla];
    if (!relacion) return null;
    return (
      <InputGroup>
        <Label>{tabla.charAt(0).toUpperCase() + tabla.slice(1)}</Label>
        <Select
          name={campo}
          value={licitacion.articulos[index][campo] || ""}
          onChange={(e) => handleArticuloChange(index, e)}
        >
          <option value="">Seleccione {tabla}</option>
          {relacion.datos.map((item) => (
            <option key={item.id} value={item.id}>
              {item[relacion.labelField]}
            </option>
          ))}
        </Select>
      </InputGroup>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await window.api.post("/api/inventario/licitacion/uso", licitacion);
    if (response.error) return alert("Error al guardar: " + response.error);

    if (response.identificables.length > 0) {
      setIdentificables(response.identificables);
      setShowModal(true);
    } else {
      alert("Licitación guardada correctamente.");
    }
  };

  const handleCodigoChange = (articuloId, index, value) => {
    setCodigosIdentificados((prev) => {
      const actuales = prev[articuloId] || [];
      actuales[index] = value;
      return { ...prev, [articuloId]: actuales };
    });
  };

  const handleGuardarCodigos = async () => {
    const datos = Object.entries(codigosIdentificados).flatMap(([id_articulo, codigos]) =>
      codigos.map((codigo) => ({ id_articulo: Number(id_articulo), codigo }))
    );

    const res = await window.api.post("/api/inventario/articulos-identificados", { codigos: datos });
    if (res.error) return alert("Error al guardar identificados");

    alert("Licitación e identificables guardados correctamente.");
    setShowModal(false);
    setLicitacion({
      nombre: "",
      año: "",
      articulos: [
        {
          nombre: "",
          descripcion: "",
          codigo: "",
          precio: "",
          numero_serie: "",
          identificable: false,
          tipo_bien: "USO",
          unidad_medida_id: "",
          categoria_id: "",
          marca_id: "",
          ubicacion_id: "",
          cantidad_existencia: "",
        },
      ],
    });
  };

  return (
    <Container>
      <h1>Crear Licitación de Bienes de Uso</h1>
      {error && <ErrorText>{error}</ErrorText>}

      <form onSubmit={handleSubmit}>
        <FormGroup>
          <InputGroup>
            <Label>Nombre Licitación</Label>
            <Input name="nombre" value={licitacion.nombre} onChange={handleLicitacionChange} required />
          </InputGroup>

          <InputGroup>
            <Label>Año</Label>
            <Input name="año" value={licitacion.año} onChange={handleLicitacionChange} required />
          </InputGroup>
        </FormGroup>

        <h2>Artículos</h2>
        {licitacion.articulos.map((art, i) => (
          <ArticuloRow key={i}>
            <RowGrid>
              <InputGroup><Label>Nombre</Label><Input name="nombre" value={art.nombre} onChange={(e) => handleArticuloChange(i, e)} /></InputGroup>
              <InputGroup><Label>Descripción</Label><Input name="descripcion" value={art.descripcion} onChange={(e) => handleArticuloChange(i, e)} /></InputGroup>
              <InputGroup><Label>Código</Label><Input name="codigo" value={art.codigo} onChange={(e) => handleArticuloChange(i, e)} /></InputGroup>
              <InputGroup><Label>Precio</Label><Input type="number" step="0.01" name="precio" value={art.precio} onChange={(e) => handleArticuloChange(i, e)} /></InputGroup>
              <InputGroup><Label>Nro. Serie</Label><Input name="numero_serie" value={art.numero_serie} onChange={(e) => handleArticuloChange(i, e)} /></InputGroup>
              <InputGroup><Label><input type="checkbox" name="identificable" checked={art.identificable} onChange={(e) => handleArticuloChange(i, e)} />&nbsp;Identificable</Label></InputGroup>
              {renderSelect(i, "unidad_medida_id")}
              {renderSelect(i, "categoria_id")}
              {renderSelect(i, "marca_id")}
              {renderSelect(i, "ubicacion_id")}
              <InputGroup><Label>Cantidad Existencia</Label><Input type="number" name="cantidad_existencia" value={art.cantidad_existencia} onChange={(e) => handleArticuloChange(i, e)} /></InputGroup>
            </RowGrid>
          </ArticuloRow>
        ))}

        <Button type="button" onClick={agregarArticulo}>+ Agregar Artículo</Button>
        <Button type="submit">Enviar Licitación</Button>
      </form>

      {showModal && (
        <ModalOverlay>
          <ModalContent>
            <h3>Completar artículos identificables</h3>
            {identificables.map((item) => (
              <div key={item.id}>
                <strong>{item.nombre}</strong>
                {[...Array(item.cantidad)].map((_, i) => (
                  <Input
                    key={i}
                    placeholder={`Código ${i + 1}`}
                    value={(codigosIdentificados[item.id] || [])[i] || ""}
                    onChange={(e) => handleCodigoChange(item.id, i, e.target.value)}
                  />
                ))}
              </div>
            ))}
            <Button onClick={handleGuardarCodigos}>Guardar Códigos</Button>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}


const Container = styled.div`
  max-width: 1100px;
  margin: 30px auto;
  padding: 20px;
  font-family: Inter, sans-serif;
`;

const FormGroup = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 160px;
`;

const Label = styled.label`
  font-weight: 500;
  margin-bottom: 4px;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 6px;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
`;

const ArticuloRow = styled.div`
  border: 1px solid #ddd;
  padding: 14px;
  margin-bottom: 16px;
  border-radius: 8px;
`;

const RowGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 20px;
  font-weight: 600;
  &:hover {
    background-color: #0056b3;
  }
`;

const ErrorText = styled.p`
  color: red;
  margin-bottom: 12px;
  font-weight: 500;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
`;
