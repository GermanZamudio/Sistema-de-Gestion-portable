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
  const [modalSetState, setModalSetState] = useState(null);
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

  const openModal = (title, url, camposAuto = {}, camposIgnorados = []) => {
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
    window.location.reload(); // recarga para mostrar los nuevos datos
  };

  return (
    <Container>
      <Title>Edificios y Departamentos</Title>
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <ButtonsRow>
        <ActionButton onClick={() => openModal("Edificio", "edificio")}>
          ➕ Nuevo edificio
        </ActionButton>
        <ActionButton onClick={() => openModal("Departamento", "departamento")}>
          ➕ Nuevo departamento
        </ActionButton>
      </ButtonsRow>

      <Section>
        <List>
          {Object.entries(data).map(([edificio, obj]) => (
            <Item key={edificio}>
              <SectorLeft>
                <Name>{edificio}</Name>
                <Direccion>{obj.direccion}</Direccion>

                <ToggleButton onClick={() => toggleExpand(edificio)}>
                  {expandedBuildings[edificio] ? (
                    <>
                      Departamentos <ArrowDown>▾</ArrowDown>
                    </>
                  ) : (
                    <>
                      Departamentos <ArrowRight>▸</ArrowRight>
                    </>
                  )}
                </ToggleButton>

                {expandedBuildings[edificio] && (
                  <DepartmentList>
                    {Object.entries(obj.pisos).map(([piso, departamentos]) => (
                      <FloorSection key={piso}>
                        <FloorButton onClick={() => toggleFloor(edificio, piso)}>
                          {expandedFloors[`${edificio}-${piso}`] ? (
                            <>
                              Piso {piso} <ArrowDown>▾</ArrowDown>
                            </>
                          ) : (
                            <>
                              Piso {piso} <ArrowRight>▸</ArrowRight>
                            </>
                          )}
                        </FloorButton>
                        {expandedFloors[`${edificio}-${piso}`] && (
                          <DepartmentsUl>
                            {departamentos.map((depto) => (
                              <DepartmentsLi key={depto.id}>
                                <StyledLink to={`/departamento/${depto.id}`}>
                                  Departamento {depto.numero}
                                </StyledLink>
                              </DepartmentsLi>
                            ))}
                          </DepartmentsUl>
                        )}
                      </FloorSection>
                    ))}
                  </DepartmentList>
                )}
              </SectorLeft>

              <SectorRight>
                {obj.imagen ? (
                  <Image src={obj.imagen} alt={`Imagen de ${edificio}`} />
                ) : (
                  <NoImageText>(Sin imagen disponible)</NoImageText>
                )}
              </SectorRight>
            </Item>
          ))}
        </List>
      </Section>

      <BackLink href="/home">← Volver atrás</BackLink>

      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          title={`Crear ${modalTitle}`}
          onClose={closeModal}
          setState={modalSetState}
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
  max-width: 900px;
  margin: 50px auto 80px;
  padding: 0 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  color: #2c3e50;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 40px;
  font-weight: 700;
  font-size: 2.4rem;
  letter-spacing: 1.2px;
  color: #1f2937;
`;

const ErrorMessage = styled.p`
  color: #ef4444;
  text-align: center;
  margin-bottom: 25px;
  font-weight: 600;
`;

const ButtonsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-bottom: 30px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ActionButton = styled.button`
  background-color: #3b82f6;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background-color 0.25s ease;

  &:hover {
    background-color: #2563eb;
  }
`;

const Section = styled.div`
  display: flex;
  justify-content: center;
`;

const List = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 36px;
`;

const Item = styled.div`
  display: flex;
  background: #ffffff;
  padding: 24px 28px;
  border-radius: 16px;
  box-shadow: 0 12px 20px rgb(0 0 0 / 0.06);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 16px 28px rgb(0 0 0 / 0.12);
  }

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const SectorLeft = styled.div`
  flex: 1;
  padding-right: 30px;

  @media (max-width: 720px) {
    padding-right: 0;
    margin-bottom: 20px;
  }
`;

const SectorRight = styled.div`
  width: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Name = styled.h2`
  font-weight: 700;
  font-size: 1.8rem;
  margin-bottom: 8px;
  color: #111827;
`;

const Direccion = styled.p`
  font-style: italic;
  color: #6b7280;
  margin-bottom: 18px;
  font-size: 0.95rem;
`;

const ToggleButton = styled.button`
  background: transparent;
  border: none;
  color: #3b82f6;
  font-weight: 600;
  cursor: pointer;
  font-size: 1.05rem;
  padding: 6px 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  user-select: none;
  transition: color 0.25s ease;

  &:hover {
    color: #2563eb;
    text-decoration: underline;
  }
`;

const FloorButton = styled.button`
  background: transparent;
  border: none;
  color: #10b981;
  font-weight: 600;
  cursor: pointer;
  margin: 10px 0 6px 0;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  user-select: none;
  transition: color 0.25s ease;

  &:hover {
    color: #059669;
    text-decoration: underline;
  }
`;

const DepartmentList = styled.div`
  margin-left: 16px;
  border-left: 2px solid #d1d5db;
  padding-left: 18px;
  margin-top: 10px;
`;

const FloorSection = styled.div``;

const DepartmentsUl = styled.ul`
  list-style: none;
  padding-left: 14px;
  margin-top: 6px;
`;

const DepartmentsLi = styled.li`
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const StyledLink = styled(Link)`
  color: #2563eb;
  font-weight: 500;
  text-decoration: none;
  font-size: 0.96rem;
  transition: color 0.3s ease;

  &:hover {
    color: #1e40af;
    text-decoration: underline;
  }
`;

const Image = styled.img`
  width: 220px;
  height: 140px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 8px 14px rgb(0 0 0 / 0.1);
  user-select: none;
`;

const NoImageText = styled.p`
  color: #9ca3af;
  font-style: italic;
  font-size: 0.9rem;
  text-align: center;
`;

const BackLink = styled.a`
  display: block;
  margin: 50px auto 0;
  text-align: center;
  color: #2563eb;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.1rem;
  max-width: 150px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 2px solid transparent;
  user-select: none;
  transition: all 0.3s ease;

  &:hover {
    background: #2563eb;
    color: white;
    border-color: #1e40af;
    box-shadow: 0 6px 10px rgb(37 99 235 / 0.35);
  }
`;

const ArrowRight = styled.span`
  font-weight: 900;
  font-size: 1.12rem;
  line-height: 1;
  color: #3b82f6;
`;

const ArrowDown = styled.span`
  font-weight: 900;
  font-size: 1.12rem;
  line-height: 1;
  color: #3b82f6;
`;
