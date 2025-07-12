import { useState, useEffect } from 'react';
import styled from 'styled-components';
import ReactSelect from 'react-select';

export default function CrearOrdenCompra() {
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [proveedorOptions, setProveedorOptions] = useState([]);
  const [articulosOptions, setArticulosOptions] = useState([]);
  const [ubicacionOptions, setUbicacionOptions] = useState([]);
  const [selectsArticulos, setSelectsArticulos] = useState([0]);

  // Nuevo estado
  const [codigoRef, setCodigoRef] = useState("");

  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [articulosSeleccionados, setArticulosSeleccionados] = useState(
    [{ articulo: null, cantidadPedida: "", cantidadRecibida: "", ubicacion: null }]
  );

  useEffect(() => {
    async function getForm() {
      const form = await window.api.get('/api/form_orden_compra');
      if (form.error) {
        setError(form.error);
      } else {
        setProveedorOptions(
          (Array.isArray(form.proveedor) ? form.proveedor : []).map(p => ({
            value: p.id,
            label: p.razon_social
          }))
        );
        setArticulosOptions(
          (Array.isArray(form.articulos) ? form.articulos : []).map(a => ({
            value: a.id,
            label: a.nombre
          }))
        );
        setUbicacionOptions(
          (Array.isArray(form.ubicacion) ? form.ubicacion : []).map(u => ({
            value: u.id,
            label: u.nombre
          }))
        );
      }
    }
    getForm();
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
    if (name === 'cantidadPedida') nuevos[index].cantidadPedida = value;
    else if (name === 'cantidadRecibida') nuevos[index].cantidadRecibida = value;
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

    if (!proveedorSeleccionado) {
      setError("Debe seleccionar un proveedor");
      return;
    }

    if (!codigoRef.trim()) {
      setError("Debe ingresar un código de referencia");
      return;
    }

    const articulos_comprados = articulosSeleccionados.map((item, idx) => {
      if (!item.articulo || item.cantidadPedida === "") {
        setError(`Debe seleccionar artículo y cantidad pedida válida en el artículo ${idx + 1}`);
        throw new Error("Campo inválido");
      }
      if (isNaN(item.cantidadPedida) || (item.cantidadRecibida !== "" && isNaN(item.cantidadRecibida))) {
        setError(`Las cantidades deben ser números válidos en el artículo ${idx + 1}`);
        throw new Error("Cantidad inválida");
      }

      return {
        articulo_id: item.articulo.value,
        cantidad_pedida: Number(item.cantidadPedida),
        cantidad_recibida: item.cantidadRecibida === "" ? 0 : Number(item.cantidadRecibida),
        ubicacion_id: item.ubicacion ? item.ubicacion.value : null,
      };
    });

    if (articulos_comprados.length === 0) {
      setError("Debe agregar al menos un artículo con cantidad");
      return;
    }

    const fechaHoy = new Date().toISOString().split('T')[0];
    const datosEnviar = {
      orden_compra: {
        fecha: fechaHoy,
        proveedor_id: proveedorSeleccionado.value,
        codigo_ref: codigoRef,  // ✅ NUEVO CAMPO
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
        setCodigoRef("");  // ✅ Limpiar campo
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

      <Form onSubmit={handleSubmit}>
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

        <Divider />

        <Section>
          <SectionTitle>Artículos</SectionTitle>
          <ButtonRow>
            <Button type="button" onClick={handleAdd}>Agregar Artículo</Button>
            <Button type="button" onClick={handleDelete}>Quitar Último</Button>
          </ButtonRow>

          {selectsArticulos.map((id, index) => (
            <ArticuloRow key={id}>
              <ReactSelect
                options={articulosOptions}
                value={articulosSeleccionados[index]?.articulo || null}
                onChange={(selectedOption) => handleArticuloChange(selectedOption, index)}
                placeholder="Seleccione un artículo"
                styles={{ container: base => ({ ...base, flex: '1 1 200px' }) }}
              />
              <Input
                type="number"
                name="cantidadPedida"
                placeholder="Cantidad comprada"
                value={articulosSeleccionados[index]?.cantidadPedida}
                onChange={(e) => handleInputChange(e, index)}
              />
              <Input
                type="number"
                name="cantidadRecibida"
                placeholder="Cantidad recibida"
                value={articulosSeleccionados[index]?.cantidadRecibida}
                onChange={(e) => handleInputChange(e, index)}
              />
              <ReactSelect
                options={ubicacionOptions}
                value={articulosSeleccionados[index]?.ubicacion || null}
                onChange={(selectedOption) => handleUbicacionChange(selectedOption, index)}
                placeholder="Seleccione ubicación"
                styles={{ container: base => ({ ...base, flex: '1 1 200px' }) }}
                isClearable
              />
            </ArticuloRow>
          ))}
        </Section>

        <Divider />

        <SubmitButton type="submit">Guardar</SubmitButton>
      </Form>

      <BackLink href="/home">← Volver atrás</BackLink>
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  max-width: 850px;
  margin: 40px auto;
  padding: 35px;
  background: #fcfcfc;
  border-radius: 12px;
  box-shadow: 0 0 14px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  text-align: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 36px;
  margin-bottom: 30px;
  font-weight: 600;
  color: #2c3e50;
`;

const MensajeError = styled.p`
  color: red;
  font-weight: bold;
`;

const MensajeSuccess = styled.p`
  color: green;
  font-weight: bold;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  margin-bottom: 8px;
  color: #34495e;
  font-weight: 600;
`;

const Divider = styled.hr`
  border: none;
  height: 1px;
  background-color: #ddd;
  margin: 20px 0;
`;

const Input = styled.input`
  padding: 10px;
  border-radius: 6px;
  border: 1.5px solid #ccc;
  width: 100px;
`;

const ArticuloRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  align-items: center;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  background-color: #e67e22;
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;

  &:hover {
    background-color: #d35400;
  }
`;

const SubmitButton = styled.button`
  background-color: #2980b9;
  border: none;
  color: white;
  padding: 14px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background-color: #1f6391;
  }
`;

const BackLink = styled.a`
  display: block;
  margin-top: 20px;
  color: #555;
  text-decoration: underline;
  text-align: center;
  font-size: 15px;

  &:hover {
    color: #000;
  }
`;
