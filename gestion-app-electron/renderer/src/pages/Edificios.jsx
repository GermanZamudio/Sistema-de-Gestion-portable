import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import Modal from "../components/Modals/CreateAuxiliares";

export default function EdificiosDepartamentos() {
  const [error, setError] = useState("");
  const [data, setData] = useState({});
  const [expandedBuildings, setExpandedBuildings] = useState({});
  const [expandedFloors, setExpandedFloors] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalUrl, setModalUrl] = useState("");
  const [camposAuto, setCamposAuto] = useState({});
  const [camposIgnorados, setCamposIgnorados] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const response = await window.api.get("/api/edificios/");
      if (response.error) setError(response.error);
      else setData(response);
    }
    fetchData();
  }, []);

  const toggleExpand = (edificio) => {
    setExpandedBuildings((prev) => ({
      ...prev,
      [edificio]: !prev[edificio],
    }));
  };

  const toggleFloor = (edificio, piso) => {
    const key = `${edificio}-${piso}`;
    setExpandedFloors((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const openModal = (title, url, camposAuto = {}, camposIgnorados = ["estado"]) => {
    setModalTitle(title);
    setModalUrl(url);
    setCamposAuto(camposAuto);
    setCamposIgnorados(camposIgnorados);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalTitle("");
    setModalUrl("");
    setCamposAuto({});
    setCamposIgnorados([]);
    window.location.reload();
  };

  return (
    <Container>
      <Title>Edificios y Departamentos</Title>
      {error && <ErrorText>{error}</ErrorText>}

      <HeaderRow>
        <ActionButton onClick={() => openModal("Edificio", "edificio")}>+ Nuevo edificio</ActionButton>
        <ActionButton onClick={() => openModal("Departamento", "departamento")}>+ Nuevo departamento</ActionButton>
      </HeaderRow>

      <BuildingsWrapper>
        {Object.entries(data).map(([edificio, obj]) => (
          <BuildingCard key={edificio}>
            <BuildingLeft>
              <BuildingName>{edificio}</BuildingName>
              <BuildingAddress>{obj.direccion}</BuildingAddress>

              <ToggleButton onClick={() => toggleExpand(edificio)}>
                {expandedBuildings[edificio] ? <>Departamentos <ArrowDown>▾</ArrowDown></> 
                                            : <>Departamentos <ArrowRight>▸</ArrowRight></>}
              </ToggleButton>

              {expandedBuildings[edificio] && (
                <FloorsList>
                  {Object.entries(obj.pisos).map(([piso, departamentos]) => (
                    <FloorSection key={piso}>
                      <FloorButton onClick={() => toggleFloor(edificio, piso)}>
                        {expandedFloors[`${edificio}-${piso}`] ? <>Piso {piso} <ArrowDown>▾</ArrowDown></> 
                                                                : <>Piso {piso} <ArrowRight>▸</ArrowRight></>}
                      </FloorButton>

                      {expandedFloors[`${edificio}-${piso}`] && (
                        <DepartmentsUl>
                          {departamentos.map((depto) => (
                            <DepartmentsLi key={depto.id}>
                              <StyledLink to={`/departamento/${depto.id}`}>Departamento {depto.numero}</StyledLink>
                            </DepartmentsLi>
                          ))}
                        </DepartmentsUl>
                      )}
                    </FloorSection>
                  ))}
                </FloorsList>
              )}
            </BuildingLeft>

            <BuildingRight>
              {obj.imagen ? <BuildingImage src={obj.imagen} alt={`Imagen de ${edificio}`} /> 
                         : <NoImageText>(Sin imagen disponible)</NoImageText>}
            </BuildingRight>
          </BuildingCard>
        ))}
      </BuildingsWrapper>

      <BackLink href="/home">← Volver atrás</BackLink>

      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          title={`Crear ${modalTitle}`}
          onClose={closeModal}
          setState={setData}
          url={modalUrl}
          campos_auto={camposAuto}
          campo_ignorado={camposIgnorados}
        />
      )}
    </Container>
  );
}

// --- Styled Components ---

const Container = styled.div`
  max-width: 1100px;
  margin: 40px auto 80px;
  padding: 0 24px;
  font-family: 'Inter', sans-serif;
`;

const Title = styled.p`
  font-size: 1.8rem;
  text-align: center;
  margin-bottom: 30px;
`;

const ErrorText = styled.p`
  color: red;
  text-align: center;
  margin-bottom: 20px;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 25px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ActionButton = styled.button`
  background-color: #28a745;
  color: white;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.25s ease;

  &:hover {
    background-color: #218838;
  }
`;

const BuildingsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-height: 550px;
  overflow-y: auto;
  padding-right: 4px;
`;

const BuildingCard = styled.div`
  display: flex;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 12px rgb(0 0 0 / 0.06);
  padding: 20px;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 10px 18px rgb(0 0 0 / 0.12);
  }

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const BuildingLeft = styled.div`
  flex: 1;
  padding-right: 20px;

  @media (max-width: 720px) {
    padding-right: 0;
    margin-bottom: 16px;
  }
`;

const BuildingRight = styled.div`
  width: 220px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const BuildingName = styled.p`
  font-size: 1.2rem;
  margin-bottom: 6px;
  color: #111827;
`;

const BuildingAddress = styled.p`
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 12px;
  font-style: italic;
`;

const ToggleButton = styled.button`
  background: transparent;
  border: none;
  color: #3b82f6;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: color 0.25s ease;

  &:hover {
    color: #2563eb;
    text-decoration: underline;
  }
`;

const FloorButton = styled(ToggleButton)`
  color: #10b981;

  &:hover {
    color: #059669;
  }

  margin: 6px 0 4px 0;
  font-size: 0.9rem;
`;

const FloorsList = styled.div`
  margin-left: 16px;
  border-left: 2px solid #d1d5db;
  padding-left: 14px;
  margin-top: 8px;
`;

const FloorSection = styled.div``;

const DepartmentsUl = styled.ul`
  list-style: none;
  margin-top: 4px;
  padding-left: 12px;
`;

const DepartmentsLi = styled.li`
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const StyledLink = styled(Link)`
  color: #2563eb;
  font-weight: 500;
  font-size: 0.87rem;
  text-decoration: none;

  &:hover {
    color: #1e40af;
    text-decoration: underline;
  }
`;

const BuildingImage = styled.img`
  width: 220px;
  height: 140px;
  object-fit: cover;
  border-radius: 10px;
  box-shadow: 0 6px 12px rgb(0 0 0 / 0.08);
`;

const NoImageText = styled.p`
  font-size: 0.85rem;
  font-style: italic;
  color: #9ca3af;
  text-align: center;
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

const ArrowRight = styled.span`
  font-weight: 700;
  font-size: 1rem;
  color: #3b82f6;
`;

const ArrowDown = styled.span`
  font-weight: 700;
  font-size: 1rem;
  color: #3b82f6;
`;
