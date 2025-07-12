import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import styled from "styled-components";

export default function CrearOrdenCompra() {
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [departamentos, setDepartamentos] = useState([]);
  const [ubicacion, setUbicacion] = useState([]);

  const [articulos, setArticulos] = useState([]);
  const [identificados, setIdentificados] = useState([]);

  // Estado para guardar la imagen seleccionada como base64
  const [imagenBase64, setImagenBase64] = useState("");

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      nombre: "",
      descripcion: "",
      responsable: "",
      departamento: "",
      ubicacion: "",
      articulosAsignados: [{ articulo_id: "", cantidad_asignada: "", cantidad_entregada: "" }],
      identificadosAsignados: [{ articulo_identificado_id: "", estado: "ASIGNADO" }],
      sobrantesAsignados: [{ sobrante_id: "" }],
    },
  });

  const { fields: articulosFields, append: appendArticulo, remove: removeArticulo } = useFieldArray({
    control,
    name: "articulosAsignados",
  });

  const { fields: identificadosFields, append: appendIdentificado, remove: removeIdentificado } = useFieldArray({
    control,
    name: "identificadosAsignados",
  });


  useEffect(() => {
    async function getForms() {
      const form = await window.api.get("/api/form_orden_servicio");
      if (form.error) {
        setError(form.error);
      } else {
        setDepartamentos(form.departamentos);
        setUbicacion(form.ubicacion);
        setArticulos(form.articulos);
        setIdentificados(form.articulos_identificados);
      }
    }
    getForms();
  }, []);

  // Función para leer archivo imagen y convertir a base64
  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImagenBase64("");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      // reader.result es un string base64 con prefijo data:image/...
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
        imagen: imagenBase64, // <-- aquí agregamos la imagen base64
      },
      articulos_asignados: data.articulosAsignados
        .filter((a) => a.articulo_id && a.cantidad_asignada)
        .map((a) => ({
          articulo_id: Number(a.articulo_id),
          cantidad_asignada: Number(a.cantidad_asignada),
          cantidad_entregada: Number(a.cantidad_entregada || 0),
        })),
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
      } else {
        setMensaje(respuesta.mensaje);
        reset();
        setImagenBase64(""); // limpiar la imagen seleccionada
      }
    } catch (err) {
      setError("Error al enviar los datos: " + err.message);
    }
  };

  return (
    <Container>
      <Title>Crear Orden de Servicio</Title>

      {mensaje && <MensajeExito>{mensaje}</MensajeExito>}
      {error && <MensajeError>{error}</MensajeError>}

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Label>Nombre</Label>
        <Input {...register("nombre")} />

        <Label>Descripcion</Label>
        <Input {...register("descripcion")} />

        <Label>Personal a cargo</Label>
        <Input {...register("responsable")} />

        <Label>Departamento</Label>
        <Select {...register("departamento")}>
          <option value="">Seleccione un Departamento</option>
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.numero} - {d.piso}
            </option>
          ))}
        </Select>

        <Label>Ubicación de Artículos</Label>
        <Select {...register("ubicacion")}>
          <option value="">Seleccione una ubicación</option>
          {ubicacion.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </Select>

        {/* Campo imagen */}
        <Label>Imagen</Label>
        <Input type="file" accept="image/*" onChange={handleImagenChange} />
        {imagenBase64 && <PreviewImagen src={imagenBase64} alt="Imagen seleccionada" />}

        {/* Artículos dinámicos */}
        <Section>
          <SectionHeader>
            <Label>Artículos</Label>
            <Comandos>
              <ButtonSmall type="button" onClick={() => appendArticulo({ articulo_id: "", cantidad_asignada: "", cantidad_entregada: "" })}>
                Add +
              </ButtonSmall>
              <ButtonSmall
                type="button"
                onClick={() => articulosFields.length > 1 && removeArticulo(articulosFields.length - 1)}
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
              {articulosFields.map((field, index) => (
                <Tr key={field.id}>
                  <Td>
                    <Select {...register(`articulosAsignados.${index}.articulo_id`)}>
                      <option value="">Seleccione un Artículo</option>
                      {articulos.map((a) => (
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
                      {...register(`articulosAsignados.${index}.cantidad_asignada`)}
                    />
                  </Td>
                  <Td>
                    <InputSmall
                      type="number"
                      placeholder="Entregado"
                      {...register(`articulosAsignados.${index}.cantidad_entregada`)}
                    />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>

        {/* Identificados dinámicos */}
        <Section>
          <SectionHeader>
            <Label>Artículos Identificados</Label>
            <Comandos>
              <ButtonSmall type="button" onClick={() => appendIdentificado({ articulo_identificado_id: "", estado: "ASIGNADO" })}>
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

        <SubmitButton type="submit">Guardar</SubmitButton>
      </Form>

      <BackLink href="/home">← Volver atrás</BackLink>
    </Container>
  );
}

// Estilos con styled-components
const Container = styled.div`
  max-width: 850px;
  margin: 30px auto;
  padding: 0 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Title = styled.h1`
  font-size: 22px;
  text-align: center;
  margin-bottom: 20px;
  font-weight: 700;
`;

const MensajeExito = styled.p`
  color: green;
  font-weight: 600;
  text-align: center;
  margin-bottom: 10px;
`;

const MensajeError = styled.p`
  color: red;
  font-weight: 600;
  text-align: center;
  margin-bottom: 10px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Label = styled.label`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 3px;
`;

const Input = styled.input`
  padding: 6px 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
`;


const Section = styled.section`
  margin-top: 20px;
  border: 1px solid #ddd;
  padding: 12px 16px;
  border-radius: 6px;
  background-color: #fafafa;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 8px;
`;
const Comandos= styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

const ButtonSmall = styled.button`
  padding: 5px 12px;
  font-size: 14px;
  font-weight: 600;
  margin: 10px;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  background-color: #e67e22; /* naranja */
  color: white;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #d35400; /* naranja más oscuro */
  }
`;

const FieldRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
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
  max-width: 800px;
  margin: 0 auto 20px auto;
  border-collapse: collapse;
  font-size: 16px;
  font-family: Arial, sans-serif;
`;

const Th = styled.th`
  text-align: left;
  border-bottom: 2px solid #357edd;
  padding: 8px 12px;
  color: #357edd;
  font-weight: 600;
`;

const Td = styled.td`
  padding: 8px 12px;
  border-bottom: 1px solid #ddd;
`;

const Tr = styled.tr`
  &:hover {
    background-color: #f5faff;
  }
`;

const Select = styled.select`
  padding: 6px 10px;
  font-size: 16px;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const InputSmall = styled.input`
  width: 100%;
  max-width: 100px;
  padding: 6px 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;