import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

export default function EdificiosDepartamentos() {
  const [error, setError] = useState("");
  const [data, setData] = useState({});
  const [expandedBuildings, setExpandedBuildings] = useState({});
  const [expandedFloors, setExpandedFloors] = useState({});
  const collapseRefs = useRef({});

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

  return (
    <Container>
      <Title>Edificios y Departamentos</Title>
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Section>
        <List>
          {Object.entries(data).map(([edificio, obj]) => (
            <Item key={edificio}>
              <Sector>
                <Name>{edificio}</Name>
                <Direccion>{obj.direccion}</Direccion>

                <ToggleButton onClick={() => toggleExpand(edificio)}>
                  {expandedBuildings[edificio] ? "Departamentos ↓" : "Departamentos →"}
                </ToggleButton>

                {expandedBuildings[edificio] && (
                  <DepartmentList>
                    {Object.entries(obj.pisos).map(([piso, departamentos]) => (
                      <div key={piso}>
                        <FloorButton onClick={() => toggleFloor(edificio, piso)}>
                          {expandedFloors[`${edificio}-${piso}`] ? `Piso ${piso} ↓` : `Piso ${piso} →`}
                        </FloorButton>
                        {expandedFloors[`${edificio}-${piso}`] && (
                          <ul>
                            {departamentos.map((depto) => (
                              <li key={depto.id}>
                                <StyledLink to={`/departamento/${depto.id}`}>
                                  Departamento {depto.numero}
                                </StyledLink>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </DepartmentList>
                )}
              </Sector>

              <Sector>
                {obj.imagen ? (
                  <Image src={obj.imagen} />
                ) : (
                  <NoImageText>(Sin imagen)</NoImageText>
                )}
              </Sector>
            </Item>
          ))}
        </List>
      </Section>

      <BackLink href="/home">Volver atrás</BackLink>
    </Container>
  );
}

// --- Styled Components ---
const Container = styled.div`
  max-width: 100%;
  margin: 40px auto;
  padding: 0 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
`;
const Title = styled.h1`
  text-align: center;
  margin-bottom: 30px;
  color: #2c3e50;
`;
const ErrorMessage = styled.p`
  color: #e74c3c;
  text-align: center;
  margin-bottom: 20px;
`;
const Section = styled.div`
  display: flex;
  justify-content: center;
`;
const List = styled.div`
  width: 80%;
  display: flex;
  flex-direction: column;
  gap: 30px;
`;
const Item = styled.div`
  display: flex;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(44, 62, 80, 0.1);
`;
const Sector = styled.div`
  width: 50%;
`;
const Name = styled.h2`
  color: #34495e;
`;
const Direccion = styled.p`
  font-style: italic;
  color: #666;
  margin-bottom: 10px;
`;
const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #2980b9;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 10px;

  &:hover {
    text-decoration: underline;
  }
`;
const FloorButton = styled.button`
  background: none;
  border: none;
  color: #27ae60;
  font-weight: 500;
  cursor: pointer;
  margin: 5px 0;

  &:hover {
    text-decoration: underline;
  }
`;
const DepartmentList = styled.div`
  margin-left: 10px;
`;
const StyledLink = styled(Link)`
  color: #2980b9;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;
const Image = styled.img`
  width: 200px;
  border-radius: 8px;
`;
const NoImageText = styled.p`
  color: #999;
  font-style: italic;
  text-align: center;
`;
const BackLink = styled.a`
  display: block;
  margin-top: 30px;
  text-align: center;
  color: #2980b9;
  text-decoration: none;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;