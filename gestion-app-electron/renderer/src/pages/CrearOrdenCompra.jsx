import { useState, useEffect } from 'react';
import styled from 'styled-components';
import ReactSelect from 'react-select';
import ModalArticle from "../components/Modals/CreateArticle";
import { FiPlus, FiMinus, FiArrowLeft, FiSave, FiFilePlus } from 'react-icons/fi';

export default function CrearOrdenCompra() {
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [proveedorOptions, setProveedorOptions] = useState([]);
  const [articulosOptions, setArticulosOptions] = useState([]);
  const [ubicacionOptions, setUbicacionOptions] = useState([]);
  const [selectsArticulos, setSelectsArticulos] = useState([0]);
  const [modalOpen, setModalOpen] = useState(false);

  const [codigoRef, setCodigoRef] = useState("");
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [articulosSeleccionados, setArticulosSeleccionados] = useState([
    { articulo: null, cantidadPedida: "", cantidadRecibida: "", ubicacion: null }
  ]);

  const fetchArticulos = async () => {
    const form = await window.api.get('/api/form_orden_compra');
    if (form.error) {
      setError(form.error);
    } else {
      setProveedorOptions((form.proveedor || []).map(p => ({ value: p.id, label: p.razon_social })));
      setArticulosOptions((form.articulos || []).map(a => ({
        value: a.id,
        label: a.marca ? `${a.nombre} - ${a.marca}` : a.nombre
      })));
      setUbicacionOptions((form.ubicacion || []).map(u => ({ value: u.id, label: u.nombre })));
    }
  };

  useEffect(() => {
    fetchArticulos();
  }, []);

  const handleAdd = () => {
    setSelectsArticulos(prev => [...prev, prev.length]);
    setArticulosSeleccionados(prev => [...prev, { articulo: null, cantidadPedida: "", cantidadRecibida: "", ubicacion: null }]);
  };

  const handleDelete = () => {
    if (selectsArticulos.length > 1) {
      setSelectsArticulos(prev => prev.slice(0, -1));
      setArticulosSeleccionados(prev => prev.slice(0, -1));
    }
  };

  const handleArticuloChange = (selectedOption, index) => {
    const nuevos = [...articulosSeleccionados];
    nuevos[index].articulo = selectedOption;
    setArticulosSeleccionados(nuevos);
  };

  const handleInputChange = (e, index) => {
    const { name, value } = e.target;
    const nuevos = [...articulosSeleccionados];

    // Validación: cantidadRecibida no puede superar cantidadPedida
    if (name === "cantidadRecibida") {
      const cantidadPedida = Number(nuevos[index].cantidadPedida) || 0;
      let cantidadRecibida = Number(value) || 0;

      if (cantidadRecibida > cantidadPedida) {
        cantidadRecibida = cantidadPedida;
        setMensaje(`La cantidad recibida no puede superar la cantidad pedida (${cantidadPedida})`);
      } else {
        setMensaje("");
      }

      nuevos[index][name] = cantidadRecibida;
    } else {
      nuevos[index][name] = value;
    }

    setArticulosSeleccionados(nuevos);
  };

  const handleUbicacionChange = (selectedOption, index) => {
    const nuevos = [...articulosSeleccionados];
    nuevos[index].ubicacion = selectedOption;
    setArticulosSeleccionados(nuevos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!proveedorSeleccionado) return setError("Debe seleccionar un proveedor");
    if (!codigoRef.trim()) return setError("Debe ingresar un código de referencia");

    let articulos_comprados;

    try {
      articulos_comprados = articulosSeleccionados.map((item, idx) => {
        if (!item.articulo || item.cantidadPedida === "")
          throw new Error(`Debe seleccionar artículo y cantidad pedida válida en el artículo ${idx + 1}`);
        if (isNaN(item.cantidadPedida) || (item.cantidadRecibida !== "" && isNaN(item.cantidadRecibida)))
          throw new Error(`Las cantidades deben ser números válidos en el artículo ${idx + 1}`);

        const cantPedida = Number(item.cantidadPedida);
        const cantRecibida = item.cantidadRecibida === "" ? 0 : Number(item.cantidadRecibida);

        if (cantRecibida > cantPedida)
          throw new Error(`La cantidad recibida no puede superar la cantidad pedida en el artículo ${idx + 1}`);

        return {
          articulo_id: item.articulo.value,
          cantidad_pedida: cantPedida,
          cantidad_recibida: cantRecibida,
          ubicacion_id: item.ubicacion ? item.ubicacion.value : null
        };
      });
    } catch (err) {
      return setError(err.message);
    }

    const fechaHoy = new Date().toISOString().split('T')[0];
    const datosEnviar = {
      orden_compra: {
        fecha: fechaHoy,
        proveedor_id: proveedorSeleccionado.value,
        codigo_ref: codigoRef,
        total: 0,
      },
      articulos_comprados,
    };

    try {
      const respuesta = await window.api.post('/api/form_orden_compra', datosEnviar);
      if (respuesta.error) {
        setError("Error: " + respuesta.error);
      } else {
        setMensaje("Orden de compra creada correctamente");
        setProveedorSeleccionado(null);
        setCodigoRef("");
        setSelectsArticulos([0]);
        setArticulosSeleccionados([{ articulo: null, cantidadPedida: "", cantidadRecibida: "", ubicacion: null }]);
      }
    } catch (err) {
      setError("Error al enviar los datos: " + err.message);
    }
  };

  return (
    <Container>
      <Title>Crear Orden de Compra</Title>
      {error && <MensajeError>{error}</MensajeError>}
      {mensaje && <MensajeSuccess>{mensaje}</MensajeSuccess>}

      <ModalArticle
        isOpen={modalOpen}
        title="Crear artículo"
        onClose={async () => {
          setModalOpen(false);
          await fetchArticulos();
        }}
      />

      <ButtonNew type="button" onClick={() => setModalOpen(true)}>
        <FiFilePlus style={{ marginRight: "6px" }} />
        Nuevo artículo
      </ButtonNew>

      <Form onSubmit={handleSubmit}>
        <ContenedorProveedor>
          <Section>
            <SectionTitle>Proveedor</SectionTitle>
            <ReactSelect
              options={proveedorOptions}
              value={proveedorSeleccionado}
              onChange={setProveedorSeleccionado}
              placeholder="Seleccione un proveedor"
            />
          </Section>

          <Section>
            <SectionTitle>Código de Referencia</SectionTitle>
            <Input
              type="text"
              placeholder="Ej: OC-00123"
              value={codigoRef}
              onChange={(e) => setCodigoRef(e.target.value)}
            />
          </Section>
        </ContenedorProveedor>  
        <Divider />

        <Section>
          <SectionTitle>Artículos</SectionTitle>

          <ButtonRow>
            <Button type="button" onClick={handleAdd}>
              <FiPlus style={{ marginRight: "6px" }} />
              Agregar Artículo
            </Button>
            <Button type="button" onClick={handleDelete}>
              <FiMinus style={{ marginRight: "6px" }} />
              Quitar Último
            </Button>
          </ButtonRow>

          {selectsArticulos.map((id, index) => (
            <ArticuloRow key={id}>
              <ReactSelect
                options={articulosOptions}
                value={articulosSeleccionados[index]?.articulo}
                onChange={(selected) => handleArticuloChange(selected, index)}
                placeholder="Seleccione un artículo"
              />
              <Input
                type="number"
                name="cantidadPedida"
                placeholder="Cantidad comprada"
                value={articulosSeleccionados[index]?.cantidadPedida}
                onChange={(e) => handleInputChange(e, index)}
                min="1"
              />
              <Input
                type="number"
                name="cantidadRecibida"
                placeholder="Cantidad recibida"
                value={articulosSeleccionados[index]?.cantidadRecibida}
                onChange={(e) => handleInputChange(e, index)}
                min="0"
                max={articulosSeleccionados[index]?.cantidadPedida || ""}
              />
              <ReactSelect
                options={ubicacionOptions}
                value={articulosSeleccionados[index]?.ubicacion}
                onChange={(selected) => handleUbicacionChange(selected, index)}
                placeholder="Seleccione ubicación"
                isClearable
              />
            </ArticuloRow>
          ))}
        </Section>

        <Divider />
        <ContenedorButtons>
          <SubmitButton type="submit">
            <FiSave style={{ marginRight: "6px" }} />
            Guardar
          </SubmitButton>

          <BackLink href="/home">
            <FiArrowLeft style={{ marginRight: "6px" }} />
            Volver atrás
          </BackLink>
        </ContenedorButtons>
      </Form>
    </Container>
  );
}

// ==== ESTILOS ====

const ContenedorProveedor = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 30px;
  flex-wrap: wrap;

  @media (max-width: 900px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;
const ContenedorButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 10px;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
  }
`;
const Container = styled.div`
  max-width: 800px;
  margin: 30px auto;
  padding: 20px 24px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  font-family: 'Segoe UI', sans-serif;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #2c3e50;
  border-bottom: 1px solid #ddd;
  padding-bottom: 6px;
`;

const MensajeError = styled.p`
  color: #c0392b;
  background: #fdecea;
  padding: 6px 10px;
  border-radius: 5px;
  font-size: 14px;
`;

const MensajeSuccess = styled.p`
  color: #27ae60;
  background: #e9f7ef;
  padding: 6px 10px;
  border-radius: 5px;
  font-size: 14px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  color: #34495e;
  font-weight: 600;
`;

const Divider = styled.hr`
  border: none;
  height: 1px;
  background-color: #eee;
  margin: 16px 0;
`;

const Input = styled.input`
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 13px;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 1px rgba(52, 152, 219, 0.3);
  }
`;
const ArticuloRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 2fr;
  gap: 10px;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 12px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Button = styled.button`
  background-color: #f39c12;
  color: white;
  border: none;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;

  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background-color: #e67e22;
  }
`;

const SubmitButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 6px;

  cursor: pointer;

  &:hover {
    background-color: #2980b9;
  }
`;

const BackLink = styled.a`
  display: block;
  margin-top: 20px;
  color: #7f8c8d;
  text-decoration: none;
  font-size: 13px;
  text-align: left;

  display: flex;
  align-items: center;
  gap: 5px;

  &:hover {
    text-decoration: underline;
    color: #2c3e50;
  }
`;

const ButtonNew = styled.button`
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 8px 12px;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 12px;
  font-weight: 500;

  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background-color: #27ae60;
  }
`;
