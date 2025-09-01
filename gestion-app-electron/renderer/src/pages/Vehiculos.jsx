import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const Container = styled.div`
  max-width: 900px;
  margin: 50px auto 80px;
  padding: 0 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
`;

const Title = styled.p`
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.8rem;
  color: #1f2937;
`;

const Button = styled.button`
  background-color:  #28a745;
  color: white;
  font-weight: 600;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  margin-bottom: 20px;
  transition: background-color 0.25s ease;

  &:hover {
    background-color:#208738;
  }
`;

const ErrorMessage = styled.p`
  color: red;
  font-weight: 600;
  text-align: center;
`;

const VehicleList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const VehicleCard = styled.li`
  padding: 16px 20px;
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 6px 12px rgba(0,0,0,0.06);
  transition: box-shadow 0.25s ease;

  &:hover {
    box-shadow: 0 10px 18px rgba(0,0,0,0.12);
  }
`;

const VehicleInfo = styled.div`
  font-size: 0.95rem;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const Label = styled.span`
  color: #2563eb; /* azul para etiquetas */
  font-weight: 600;
`;

const Value = styled.span`
  color: #4b5563; /* gris para valores */
  font-weight: 500;
`;

const StyledLink = styled(Link)`
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const EmptyMessage = styled.p`
  color: #666;
  font-style: italic;
  text-align: center;
  margin-top: 20px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: ${({ show }) => (show ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 400px;
`;

const ModalTitle = styled.h3`
  margin-bottom: 16px;
  font-size: 1.4rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  margin-bottom: 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

export default function Vehiculos() {
  const [vehiculoInfo, setVehiculoInfo] = useState(null);
  const [departamentos, setDepartamentos] = useState([]);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    numero: "",             
    piso: "",               
    telefono: "",
    nombre_inquilino: "",
    apellido_inquilino: "",
    jerarquia: ""
  });

  useEffect(() => {
    async function fetchDepartamentos() {
      try {
        const response = await window.api.get('/api/edificios/vehiculos');
        if (response.error) throw new Error(response.error);

        const vehiculo = response.VEHICULO;
        if (!vehiculo || !vehiculo.pisos) {
          setVehiculoInfo(vehiculo);
          setDepartamentos([]);
          return;
        }

        const departamentosArray = Object.values(vehiculo.pisos).flat();
        setVehiculoInfo(vehiculo);
        setDepartamentos(departamentosArray);
      } catch (err) {
        setError(err.message || "Error al obtener los vehículos");
      }
    }
    fetchDepartamentos();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateVehiculo = async () => {
    try {
      const result = await window.api.post('/api/edificios/new_vehiculo/', formData);
      if (result.error) throw new Error(result.error);

      setDepartamentos([...departamentos, result]);
      setShowModal(false);
      setFormData({
        numero: "",
        piso: "",
        telefono: "",
        nombre_inquilino: "",
        apellido_inquilino: "",
        jerarquia: ""
      });
    } catch (err) {
      alert(err.message || "Error al crear vehículo");
    }
  };

  return (
    <Container>
      <Title>Vehículos</Title>
      <Button onClick={() => setShowModal(true)}>Crear Vehículo</Button>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {Array.isArray(departamentos) && departamentos.length > 0 ? (
        <VehicleList>
          {departamentos.map((dpto) => (
            <VehicleCard key={dpto.id}>
              <VehicleInfo>
                <Label>Patente:</Label> <Value>{dpto.numero}</Value>
                <Label>Marca:</Label> <Value>{dpto.piso}</Value>
              </VehicleInfo>
              <StyledLink to={`/departamento/${dpto.id}`}>
                Ver detalles
              </StyledLink>
            </VehicleCard>
          ))}
        </VehicleList>
      ) : (
        <EmptyMessage>No hay vehículos cargados.</EmptyMessage>
      )}

      {/* Modal */}
      <ModalOverlay show={showModal}>
        <ModalContent>
          <ModalTitle>Crear Vehículo</ModalTitle>
          <Input name="numero" placeholder="Patente" value={formData.numero} onChange={handleChange} />
          <Input name="piso" placeholder="Marca" value={formData.piso} onChange={handleChange} />
          <Input name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleChange} />
          <Input name="nombre_inquilino" placeholder="Nombre" value={formData.nombre_inquilino} onChange={handleChange} />
          <Input name="apellido_inquilino" placeholder="Apellido" value={formData.apellido_inquilino} onChange={handleChange} />
          <Input name="jerarquia" placeholder="Jerarquía" value={formData.jerarquia} onChange={handleChange} />

          <ModalButtons>
            <Button onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleCreateVehiculo}>Guardar</Button>
          </ModalButtons>
        </ModalContent>
      </ModalOverlay>
    </Container>
  );
}
