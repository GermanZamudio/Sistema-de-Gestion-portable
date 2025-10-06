import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  max-width: 1100px;
  margin: 40px auto;
  padding: 0 24px;
  font-family: 'Inter', sans-serif;
`;

const Title = styled.h1`
  font-size: 1.6rem;
  margin-bottom: 12px;
`;

const FiltersRow = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr auto;
  gap: 10px;
  align-items: end;
  margin-bottom: 10px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Label = styled.label`
  font-size: 0.78rem;
  color: #555;
  display: block;
  margin-bottom: 6px;
`;

const Input = styled.input`
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 0.85rem;
`;

const Select = styled.select`
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 0.85rem;
  background: #fff;
`;

const Button = styled.button`
  background-color: #357edd;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  cursor: pointer;

  &:hover { background-color: #285bb5; }
`;

const TableWrapper = styled.div`
  border-radius: 12px;
  box-shadow: 0 0 6px rgba(0,0,0,0.05);
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead th {
    background: #fafafa;
    font-weight: 600;
    color: #666;
    padding: 10px;
    font-size: 0.82rem;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    user-select: none;
  }
  tbody td {
    padding: 10px;
    font-size: 0.85rem;
    border-bottom: 1px solid #f0f0f0;
  }
  tbody tr:hover {
    background: #fcfcff;
  }
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 6px 0 12px;
`;

const Small = styled.span`
  font-size: 0.8rem;
  color: #666;
`;

const ErrorText = styled.p`
  color: #d33;
  font-size: 0.9rem;
`;

const Empty = styled.div`
  padding: 16px;
  color: #777;
  text-align: center;
`;

const Pagination = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;

  button {
    padding: 6px 10px;
    border: 1px solid #ddd;
    background: #fff;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
  }
  button[disabled] { opacity: 0.5; cursor: not-allowed; }
`;

export default function Movimientos() {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");
  const [fuente, setFuente] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const [sortBy, setSortBy] = useState("fecha");
  const [sortDir, setSortDir] = useState("desc");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        q, tipo, fuente, desde, hasta,
        page: String(page),
        pageSize: String(pageSize),
        sortBy, sortDir
      }).toString();

      const resp = await window.api.get(`/api/movimientos?${params}`);
      if (resp?.error) {
        setError(resp.error);
        setData([]);
        setTotal(0);
        setTotalPages(1);
      } else {
        setData(resp.data || []);
        setTotal(resp.total || 0);
        setTotalPages(resp.totalPages || 1);
      }
    } catch (e) {
      setError("Error al obtener movimientos");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [page, sortBy, sortDir]);

  const onSearch = () => {
    setPage(1);
    fetchData();
  };

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  const onExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        q, tipo, fuente, desde, hasta, sortBy, sortDir
      }).toString();
      // si tenés un "bridge" de window.api que devuelva blobs, genial; si no:
      window.open(`/api/movimientos/export/csv?${params}`, '_blank');
    } catch (e) {
      console.error(e);
    }
  };

  const columns = useMemo(() => ([
    { key: 'fecha', label: 'Fecha' },
    { key: 'articulo', label: 'Artículo' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'cantidad', label: 'Cantidad' },
    { key: 'fuente', label: 'Fuente' },
    { key: 'observaciones', label: 'Observaciones' },
  ]), []);

  return (
    <Container>
      <Title>Movimientos</Title>

      <FiltersRow>
        <div>
          <Label>Búsqueda</Label>
          <Input
            placeholder="Nombre de artículo u observación…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <div>
          <Label>Tipo</Label>
          <Select value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="">Todos</option>
            <option value="ENTRADA">ENTRADA</option>
            <option value="SALIDA">SALIDA</option>
            <option value="UPDATE">MODIFICACIÓN</option>
          </Select>
        </div>
        <div>
          <Label>Fuente</Label>
          <Select value={fuente} onChange={e => setFuente(e.target.value)}>
            <option value="">Todas</option>
            <option value="orden_compra">Orden de compra</option>
            <option value="orden_servicio">Orden de servicio</option>
            <option value="prestamo">Préstamo</option>
            <option value="articulo_identificado">Artículo identificado</option>
          </Select>
        </div>
        <div>
          <Label>Desde</Label>
          <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
        </div>
        <div>
          <Label>Hasta</Label>
          <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
        </div>
        <div style={{display:'flex', gap:8}}>
          <Button onClick={onSearch}>Aplicar</Button>
          <Button onClick={onExportCSV} title="Exportar CSV">CSV</Button>
        </div>
      </FiltersRow>

      <Toolbar>
        <Small>
          {loading ? 'Cargando…' : `Mostrando ${data.length} de ${total} movimientos`}
        </Small>
        <Small>
          Orden: <strong>{sortBy}</strong> {sortDir === 'asc' ? '↑' : '↓'}
        </Small>
      </Toolbar>

      {error && <ErrorText>{error}</ErrorText>}

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} onClick={() => toggleSort(col.key)}>
                  {col.label} {sortBy === col.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!loading && data.length === 0) && (
              <tr><td colSpan={columns.length}><Empty>Sin resultados.</Empty></td></tr>
            )}

            {data.map(row => (
              <tr key={row.id}>
                <td>{row.fecha ?? ''}</td>
                <td>
                  {row.articulo_nombre ?? '-'}
                  {row.articulo_codigo ? ` (${row.articulo_codigo})` : ''}
                </td>
                <td>
                  {row.tipo_movimiento === "UPDATE"
                    ? "MODIFICACIÓN"
                    : row.tipo_movimiento}
                </td>
                <td style={{textAlign:'center'}}>{row.cantidad}</td>
                <td>{row.fuente ?? '-'}</td>
                <td>{row.observaciones ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrapper>

      <Pagination>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
        <Small>Página {page} / {totalPages}</Small>
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
      </Pagination>
    </Container>
  );
}
