import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

export default function CrearLicitacionUso() {
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [identificables, setIdentificables] = useState([]);
  const [codigosIdentificados, setCodigosIdentificados] = useState({});
  const navigate = useNavigate();

  const [licitacion, setLicitacion] = useState({
    nombre: "",
    año: "",
    articulos: [crearArticuloVacio()],
  });

  useEffect(() => {
    async function fetchFormArticulos() {
      const response = await window.api.get("/api/inventario/form_licitacion");
      if (response.error) setError(response.error);
      else setForm(response);
    }
    fetchFormArticulos();
  }, []);

  const relacionesMap = useMemo(() => {
    if (!form?.relaciones) return {};
    const map = {};
    form.relaciones.forEach((r) => {
      map[r.nombre] = r;
    });
    return map;
  }, [form]);

  function crearArticuloVacio() {
    return {
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
    };
  }

  const handleLicitacionChange = (e) => {
    const { name, value } = e.target;
    setLicitacion((prev) => ({ ...prev, [name]: value }));
  };

  const handleArticuloChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    setLicitacion((prev) => {
      const articulos = [...prev.articulos];
      articulos[index] = { ...articulos[index], [name]: type === "checkbox" ? checked : value };
      return { ...prev, articulos };
    });
  };

  const agregarArticulo = () => {
    setLicitacion((prev) => ({ ...prev, articulos: [...prev.articulos, crearArticuloVacio()] }));
  };

  const renderSelect = (index, campo) => {
    const tabla = campo.replace("_id", "");
    const relacion = relacionesMap[tabla];
    if (!relacion) return null;
    return (
      <InputGroup>
        <Label>{capitalize(tabla)}</Label>
        <StyledSelect
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
        </StyledSelect>
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
    setLicitacion({ nombre: "", año: "", articulos: [crearArticuloVacio()] });
  };

  return (
    <Container>
        <Title>Crear Licitación de Bienes de Uso</Title>
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

        <Subtitle>Artículos</Subtitle>
        {licitacion.articulos.map((art, i) => (
          <ArticuloRow key={i}>
            <Row2Grid>
              <SwitchWrapper>
                <HiddenCheckbox
                  name="identificable"
                  checked={art.identificable}
                  onChange={(e) => handleArticuloChange(i, e)}
                />
                <SwitchSlider checked={art.identificable} />
                Identificable
              </SwitchWrapper>
            </Row2Grid>

            <RowGrid>
              <InputGroup><Label>Nombre</Label><Input name="nombre" value={art.nombre} onChange={(e) => handleArticuloChange(i, e)} /></InputGroup>
              <InputGroup><Label>Código</Label><Input name="codigo" value={art.codigo} onChange={(e) => handleArticuloChange(i, e)} /></InputGroup>
              <InputGroup><Label>Precio</Label><Input type="number" step="0.01" name="precio" value={art.precio} onChange={(e) => handleArticuloChange(i, e)} /></InputGroup>
              <InputGroup><Label>Nro. Serie</Label><Input name="numero_serie" value={art.numero_serie} onChange={(e) => handleArticuloChange(i, e)} /></InputGroup>
              {renderSelect(i, "unidad_medida_id")}
              {renderSelect(i, "categoria_id")}
              {renderSelect(i, "marca_id")}
              {renderSelect(i, "ubicacion_id")}
              <InputGroup><Label>Cantidad Existencia</Label><Input type="number" name="cantidad_existencia" value={art.cantidad_existencia} onChange={(e) => handleArticuloChange(i, e)} /></InputGroup>
              <InputGroupDescripcion>
                <Label>Descripción</Label>
                <TextArea name="descripcion" value={art.descripcion} onChange={(e) => handleArticuloChange(i, e)} rows={3}/>
              </InputGroupDescripcion>
            </RowGrid>
          </ArticuloRow>
        ))}

        <ContainerButton>
          <Button type="button" onClick={agregarArticulo}>+ Agregar Artículo</Button>
          <BackLink onClick={() => navigate("/bienes-uso")}>← Volver atras</BackLink>
          <ButtonSubmit type="submit">Enviar Licitación</ButtonSubmit>
        </ContainerButton>
      </form>

      {showModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>
            <p>Completar artículos identificables</p>
            </ModalTitle>
            {identificables.map((item) => (
              <ModalContainer key={item.id}>
                <p>{item.nombre}</p>
                {[...Array(item.cantidad)].map((_, i) => (
                  <Input
                    key={i}
                    placeholder={`Código ${i + 1}`}
                    value={(codigosIdentificados[item.id] || [])[i] || ""}
                    onChange={(e) => handleCodigoChange(item.id, i, e.target.value)}
                  />
                ))}
              </ModalContainer>
            ))}
            <ModalButton onClick={handleGuardarCodigos}>Guardar Códigos</ModalButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

/* ---- UTILS ---- */
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

/* ---- STYLED COMPONENTS ---- */
const Container = styled.div`
  max-width: 1100px;
  margin: 40px auto;
  padding: 20px;
  font-family: Inter, sans-serif;
  color: #555;
`;


const Title = styled.p`
  font-size: 1.8rem;
  color: #222;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 1.3rem;
  margin: 30px 0 20px;
  color: #333;
`;

const ErrorText = styled.p`
  color: red;
  margin: 10px 0;
  font-weight: 500;
`;

const FormGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 160px;
`;

const InputGroupDescripcion = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 100%;
`;

const Label = styled.label`
  font-weight: 500;
  margin-bottom: 4px;
`;

const Input = styled.input`
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.9rem;
  margin-bottom: 6px;

  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0,123,255,0.2);
    outline: none;
  }
`;

const TextArea = styled.textarea`
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.9rem;
  margin-bottom: 6px;
  resize: vertical;
  min-height: 60px;

  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0,123,255,0.2);
    outline: none;
  }
`;

const StyledSelect = styled.select`
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;

  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0,123,255,0.2);
    outline: none;
  }
`;

const ArticuloRow = styled.div`
  border: 1px solid #ddd;
  padding: 18px;
  margin-bottom: 18px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  background: #fff;
`;

const RowGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
`;

const Row2Grid = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;

  &:hover {
    background-color: #0056b3;
  }
`;

const ButtonSubmit = styled(Button)`
  background-color: #28a745;

  &:hover {
    background-color: #218838;
  }
`;

const ModalButton = styled(Button)`
  margin-top: 20px;
  width: 100%;
`;
const ModalTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-size: 1.5rem;
  margin-top: 10px;
  margin-bottom: 20px;
`
const ModalContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 100%;
`
const ContainerButton = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const ModalContent = styled.div`
  background: white;
  padding: 25px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);

  h3 {
    margin-bottom: 20px;
    color: #333;
  }
`;

/* ---- SWITCH ---- */
const SwitchWrapper = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  gap: 10px;
`;

const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
`;

const SwitchSlider = styled.span`
  position: relative;
  width: 40px;
  height: 22px;
  background-color: ${props => (props.checked ? '#007bff' : '#ccc')};
  border-radius: 22px;
  transition: 0.3s;

  &::before {
    content: "";
    position: absolute;
    left: ${props => (props.checked ? '20px' : '2px')};
    top: 2px;
    width: 18px;
    height: 18px;
    background-color: white;
    border-radius: 50%;
    transition: 0.3s;
  }
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