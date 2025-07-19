import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import styled from "styled-components";

export default function PrestamoStock() {
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [articulos, setArticulos] = useState([]);

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      nombre: "",
      autorizado: "",
      locacion: "",
      articulosPrestamo: [{ articulo_id: "", cantidad: "" }],
    },
  });

  const {
    fields: articulosPrestamoFields,
    append: appendPrestamo,
    remove: removePrestamo,
  } = useFieldArray({
    control,
    name: "articulosPrestamo",
  });

  useEffect(() => {
    async function getForms() {
      try {
        const form = await window.api.get("/api/inventario/form/prestamo");
        if (Array.isArray(form)) {
          setArticulos(form);
        } else {
          setError("Respuesta inválida del servidor.");
        }
      } catch (err) {
        setError("Error al obtener artículos: " + err.message);
      }
    }

    getForms();
  }, []);

  const onSubmit = async (data) => {
    setError("");
    setMensaje("");

    const fechaHoy = new Date().toISOString().split("T")[0];

    const datosEnviar = {
      prestamo: {
        nombre: data.nombre,
        autorizado: data.autorizado,
        fecha: fechaHoy,
        estado: "ACTIVO",
        locacion: data.locacion,
      },
      articulos_asignados: data.articulosPrestamo
        .filter((a) => a.articulo_id && a.cantidad)
        .map((a) => ({
          articulo_id: Number(a.articulo_id),
          cantidad_asignada: Number(a.cantidad),
        })),
    };

    try {
      const respuesta = await window.api.post(
        "/api/inventario/form_prestamo",
        datosEnviar
      );

      if (respuesta.error) {
        setError(respuesta.error);
      } else {
        setMensaje("Préstamo guardado correctamente.");
        reset();
      }
    } catch (err) {
      setError("Error al enviar datos: " + err.message);
    }
  };

  return (
    <Container>
      <Title>Préstamo de Herramientas</Title>

      {mensaje && <MensajeExito>{mensaje}</MensajeExito>}
      {error && <MensajeError>{error}</MensajeError>}

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Label>Nombre</Label>
        <Input {...register("nombre")} />

        <Label>Personal a cargo</Label>
        <Input {...register("autorizado")} />

        <Label>Locación</Label>
        <Input {...register("locacion")} />

        <Section>
          <SectionHeader>
            <Label>Herramientas</Label>
            <Comandos>
              <ButtonSmall
                type="button"
                onClick={() => appendPrestamo({ articulo_id: "", cantidad: "" })}
              >
                Add +
              </ButtonSmall>
              <ButtonSmall
                type="button"
                onClick={() =>
                  articulosPrestamoFields.length > 1 &&
                  removePrestamo(articulosPrestamoFields.length - 1)
                }
              >
                Remove −
              </ButtonSmall>
            </Comandos>
          </SectionHeader>

          <Table>
            <thead>
              <tr>
                <Th>Artículo</Th>
                <Th>Cantidad</Th>
              </tr>
            </thead>
            <tbody>
              {articulosPrestamoFields.map((field, index) => (
                <Tr key={field.id}>
                  <Td>
                    <Select {...register(`articulosPrestamo.${index}.articulo_id`)}>
                      <option value="">Seleccione un artículo</option>
                      {articulos.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombre}{" "}
                          {a.marca ? `(${a.marca})` : ""} - Stock: {a.cantidad}
                        </option>
                      ))}
                    </Select>
                  </Td>
                  <Td>
                    <InputSmall
                      type="number"
                      min={1}
                      {...register(`articulosPrestamo.${index}.cantidad`)}
                    />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>

        <SubmitButton type="submit">Guardar Préstamo</SubmitButton>
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

const Comandos = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ButtonSmall = styled.button`
  padding: 5px 12px;
  font-size: 14px;
  font-weight: 600;
  margin: 10px;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  background-color: #e67e22;
  color: white;
  transition: background-color 0.3s ease;

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