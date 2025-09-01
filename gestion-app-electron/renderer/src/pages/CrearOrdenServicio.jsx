import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import styled from "styled-components";

export default function CrearOrdenServicio() {
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [departamentos, setDepartamentos] = useState([]);
  const [ubicacion, setUbicacion] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [identificados, setIdentificados] = useState([]);

  // Imagen en base64
  const [imagenBase64, setImagenBase64] = useState("");

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      nombre: "",
      descripcion: "",
      responsable: "",
      departamento: "",
      ubicacion: "",
      articulosStock: [{ articulo_id: "", cantidad_asignada: "", cantidad_entregada: "" }],
      articulosUso: [{ articulo_id: "", cantidad_asignada: "", cantidad_entregada: "" }],
      articulosConsumo: [{ articulo_id: "", cantidad_asignada: "", cantidad_entregada: "" }],
      identificadosAsignados: [{ articulo_identificado_id: "", estado: "ASIGNADO" }],
      sobrantesAsignados: [{ sobrante_id: "" }],
    },
  });

  // Field arrays separados para cada tipo de artículo
  const { fields: articulosStockFields, append: appendStock, remove: removeStock } = useFieldArray({
    control,
    name: "articulosStock",
  });
  const { fields: articulosUsoFields, append: appendUso, remove: removeUso } = useFieldArray({
    control,
    name: "articulosUso",
  });
  const { fields: articulosConsumoFields, append: appendConsumo, remove: removeConsumo } = useFieldArray({
    control,
    name: "articulosConsumo",
  });

  const { fields: identificadosFields, append: appendIdentificado, remove: removeIdentificado } = useFieldArray({
    control,
    name: "identificadosAsignados",
  });

  //Creamos funcion para restablecer datos del form
  async function getForms() {
        try {
          const form = await window.api.get("/api/form_orden_servicio");
          if (form.error) {
            setError(form.error);
          } else {
            setDepartamentos(form.departamentos);
            setUbicacion(form.ubicacion);
            setArticulos(form.articulos);
            setIdentificados(form.articulos_identificados);
          }
        } catch (err) {
          setError("Error al obtener datos del formulario: " + err.message);
        }
      }
  //Restablecer mensajes
  useEffect(() => {
    if (error || mensaje) {
      const timer = setTimeout(() => {
        setError("");
        setMensaje("");
      }, 6000); // 5 segundos

      return () => clearTimeout(timer); // limpia el timeout si el componente se desmonta
    }
  }, [error, mensaje]);

  //Llamada a getForms
  useEffect(() => {
    getForms();
  }, []);

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImagenBase64("");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagenBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data) => {
    setError("");
    setMensaje("");

    if (!data.departamento) {
      setError("Debe seleccionar un departamento");
      return;
    }

    const fechaHoy = new Date().toISOString().split("T")[0];

    const datosEnviar = {
      orden_servicio: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        responsable: data.responsable,
        departamento_id: data.departamento,
        ubicacion_articulos_id: data.ubicacion,
        fecha: fechaHoy,
        estado: "ACTIVO",
        imagen: imagenBase64,
      },
      articulos_asignados: [
        ...data.articulosStock
          .filter((a) => a.articulo_id && a.cantidad_asignada)
          .map((a) => ({
            articulo_id: Number(a.articulo_id),
            cantidad_asignada: Number(a.cantidad_asignada),
            cantidad_entregada: Number(a.cantidad_entregada || 0),
          })),
        ...data.articulosUso
          .filter((a) => a.articulo_id && a.cantidad_asignada)
          .map((a) => ({
            articulo_id: Number(a.articulo_id),
            cantidad_asignada: Number(a.cantidad_asignada),
            cantidad_entregada: Number(a.cantidad_entregada || 0),
          })),
        ...data.articulosConsumo
          .filter((a) => a.articulo_id && a.cantidad_asignada)
          .map((a) => ({
            articulo_id: Number(a.articulo_id),
            cantidad_asignada: Number(a.cantidad_asignada),
            cantidad_entregada: Number(a.cantidad_entregada || 0),
          })),
      ],
      identificado_asignado: data.identificadosAsignados
        .filter((i) => i.articulo_identificado_id)
        .map((i) => ({
          articulo_identificado_id: Number(i.articulo_identificado_id),
          estado: i.estado,
        })),
      sobrantes_asignados: data.sobrantesAsignados
        .filter((s) => s.sobrante_id)
        .map((s) => ({
          sobrante_id: Number(s.sobrante_id),
        })),
    };

    try {
      const respuesta = await window.api.post("/api/form_orden_servicio/", datosEnviar);
      if (respuesta.error) {
        setError(respuesta.error);
        console.log(error)
      } else {
        setMensaje(respuesta.message);
        reset();
        setImagenBase64("");
        getForms();
      }
      
    } catch (err) {
      setError("Error al enviar los datos: " + err.message);
    }
  };

  return (
    <Container>
      <Title>Crear Orden de Servicio</Title>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Label>Nombre</Label>
        <Input {...register("nombre")} />

        <Label>Descripcion</Label>
        <Input {...register("descripcion")} />

        <Label>Personal a cargo</Label>
        <Input {...register("responsable")} />

        <Label>Departamento o Dispositivo</Label>
        <Select {...register("departamento")}>
          <option value="">Seleccione un Departamento</option>
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.edificio} Piso {d.piso}° - dpto {d.numero}°
            </option>
          ))}
        </Select>

        <Label>Ubicación de Artículos en deposito</Label>
        <Select {...register("ubicacion")}>
          <option value="">Seleccione una ubicación</option>
          {ubicacion.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </Select>

        <Label>Imagen de Trabajo</Label>
        <Input type="file" accept="image/*" onChange={handleImagenChange} />
        {imagenBase64 && <PreviewImagen src={imagenBase64} alt="Imagen seleccionada" />}

        {/* Artículos tipo STOCK */}
        <Section>
          <SectionHeader>
            <Label>Artículos - STOCK</Label>
            <Comandos>
              <ButtonSmall type="button" onClick={() => appendStock({ articulo_id: "", cantidad_asignada: "", cantidad_entregada: "" })}>
                Add +
              </ButtonSmall>
              <ButtonSmall
                type="button"
                onClick={() => articulosStockFields.length > 1 && removeStock(articulosStockFields.length - 1)}
              >
                Remove −
              </ButtonSmall>
            </Comandos>
          </SectionHeader>
          <Table>
            <thead>
              <tr>
                <Th>Artículo</Th>
                <Th>Asignado</Th>
                <Th>Entregado</Th>
              </tr>
            </thead>
            <tbody>
              {articulosStockFields.map((field, index) => (
                <Tr key={field.id}>
                  <Td>
                    <Select {...register(`articulosStock.${index}.articulo_id`)}>
                      <option value="">Seleccione un Artículo</option>
                      {articulos
                        .filter((a) => a.tipo_bien === "STOCK")
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nombre} - Stock: {a.cantidad}
                          </option>
                        ))}
                    </Select>
                  </Td>
                  <Td>
                    <InputSmall
                      type="number"
                      placeholder="Asignado"
                      {...register(`articulosStock.${index}.cantidad_asignada`)}
                    />
                  </Td>
                  <Td>
                    <InputSmall
                      type="number"
                      placeholder="Entregado"
                      {...register(`articulosStock.${index}.cantidad_entregada`)}
                    />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>

        {/* Artículos tipo USO */}
        <Section>
          <SectionHeader>
            <Label>Bienes de Uso</Label>
            <Comandos>
              <ButtonSmall type="button" onClick={() => appendUso({ articulo_id: "", cantidad_asignada: "", cantidad_entregada: "" })}>
                Add +
              </ButtonSmall>
              <ButtonSmall
                type="button"
                onClick={() => articulosUsoFields.length > 1 && removeUso(articulosUsoFields.length - 1)}
              >
                Remove −
              </ButtonSmall>
            </Comandos>
          </SectionHeader>
          <Table>
            <thead>
              <tr>
                <Th>Artículo</Th>
                <Th>Asignado</Th>
                <Th>Entregado</Th>
              </tr>
            </thead>
            <tbody>
              {articulosUsoFields.map((field, index) => (
                <Tr key={field.id}>
                  <Td>
                    <Select {...register(`articulosUso.${index}.articulo_id`)}>
                      <option value="">Seleccione un bien de uso</option>
                      {articulos
                        .filter((a) => a.tipo_bien === "USO")
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nombre} - Stock: {a.cantidad}
                          </option>
                        ))}
                    </Select>
                  </Td>
                  <Td>
                    <InputSmall
                      type="number"
                      placeholder="Asignado"
                      {...register(`articulosUso.${index}.cantidad_asignada`)}
                    />
                  </Td>
                  <Td>
                    <InputSmall
                      type="number"
                      placeholder="Entregado"
                      {...register(`articulosUso.${index}.cantidad_entregada`)}
                    />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>

        {/* Artículos tipo CONSUMO */}
        <Section>
          <SectionHeader>
            <Label>Artículos de Consumo</Label>
            <Comandos>
              <ButtonSmall
                type="button"
                onClick={() => appendConsumo({ articulo_id: "", cantidad_asignada: "", cantidad_entregada: "" })}
              >
                Add +
              </ButtonSmall>
              <ButtonSmall
                type="button"
                onClick={() => articulosConsumoFields.length > 1 && removeConsumo(articulosConsumoFields.length - 1)}
              >
                Remove −
              </ButtonSmall>
            </Comandos>
          </SectionHeader>
          <Table>
            <thead>
              <tr>
                <Th>Artículo</Th>
                <Th>Asignado</Th>
                <Th>Entregado</Th>
              </tr>
            </thead>
            <tbody>
              {articulosConsumoFields.map((field, index) => (
                <Tr key={field.id}>
                  <Td>
                    <Select {...register(`articulosConsumo.${index}.articulo_id`)}>
                      <option value="">Seleccione un Artículo de consumo</option>
                      {articulos
                        .filter((a) => a.tipo_bien === "CONSUMO")
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nombre} - Stock: {a.cantidad}
                          </option>
                        ))}
                    </Select>
                  </Td>
                  <Td>
                    <InputSmall
                      type="number"
                      placeholder="Asignado"
                      {...register(`articulosConsumo.${index}.cantidad_asignada`)}
                    />
                  </Td>
                  <Td>
                    <InputSmall
                      type="number"
                      placeholder="Entregado"
                      {...register(`articulosConsumo.${index}.cantidad_entregada`)}
                    />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>

        {/* Artículos Identificados */}
        <Section>
          <SectionHeader>
            <Label>Artículos Identificados</Label>
            <Comandos>
              <ButtonSmall
                type="button"
                onClick={() => appendIdentificado({ articulo_identificado_id: "", estado: "ASIGNADO" })}
              >
                Add +
              </ButtonSmall>
              <ButtonSmall
                type="button"
                onClick={() => identificadosFields.length > 1 && removeIdentificado(identificadosFields.length - 1)}
              >
                Remove −
              </ButtonSmall>
            </Comandos>
          </SectionHeader>
          <Table>
            <thead>
              <tr>
                <Th>Artículo Identificado</Th>
                <Th>Estado</Th>
              </tr>
            </thead>
            <tbody>
              {identificadosFields.map((field, index) => (
                <Tr key={field.id}>
                  <Td>
                    <Select {...register(`identificadosAsignados.${index}.articulo_identificado_id`)}>
                      <option value="">Seleccione un Artículo Identificado</option>
                      {identificados.map((i) => (
                        <option key={i.id} value={i.id}>
                          Artículo: {i.nombre_articulo} - Código: {i.codigo}
                        </option>
                      ))}
                    </Select>
                  </Td>
                  <Td>
                    <Select {...register(`identificadosAsignados.${index}.estado`)}>
                      <option value="ASIGNADO">Asignado</option>
                      <option value="ENTREGADO">Entregado</option>
                    </Select>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>

      {mensaje && <MensajeExito>{mensaje}</MensajeExito>}
      {error && <MensajeError>{error}</MensajeError>}        <SubmitButton type="submit">Guardar</SubmitButton>
      </Form>

      <BackLink href="/home">← Volver atrás</BackLink>
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  display: flex;
  justify-content:center;
  align-items: center;
  flex-direction: column;
  max-width: 850px;
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

const MensajeExito = styled.p`
 color: #27ae60; 
 background: #e9f7ef; 
 padding: 6px 10px; 
 border-radius: 5px; 
 font-size: 14px; 
`
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 700px;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #ddd;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: #fafafa;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 15px;
  font-weight: 600;
  color: #34495e;
`;

const Input = styled.input`
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 5px rgba(52, 152, 219, 0.5);
  }
`;

const InputSmall = styled.input`
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 14px;
  width: 100%;
  max-width: 100px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 5px rgba(52, 152, 219, 0.5);
  }
`;

const Select = styled.select`
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 5px rgba(52, 152, 219, 0.5);
  }
`;

const Comandos = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const ButtonSmall = styled.button`
  background-color: #f39c12;
  color: white;
  border: none;
  padding: 6px 14px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #e67e22;
  }
`;

const SubmitButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 14px;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #2980b9;
  }
`;

const BackLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  color: #7f8c8d;
  text-decoration: none;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
    color: #2c3e50;
  }
`;

const PreviewImagen = styled.img`
  margin-top: 8px;
  max-width: 200px;
  max-height: 200px;
  border: 1px solid #ccc;
  border-radius: 6px;
  object-fit: contain;
`;

const Table = styled.table`
  width: 100%;
  max-width: 100%;
  margin-top: 10px;
  border-collapse: collapse;
  font-size: 14px;
  font-family: 'Segoe UI', sans-serif;
`;

const Th = styled.th`
  text-align: left;
  border-bottom: 2px solid #3498db;
  padding: 8px 12px;
  color: #3498db;
  font-weight: 600;
`;

const Td = styled.td`
  padding: 8px 12px;
  border-bottom: 1px solid #ddd;
`;

const Tr = styled.tr`
  &:hover {
    background-color: #f0f8ff;
  }
`;
