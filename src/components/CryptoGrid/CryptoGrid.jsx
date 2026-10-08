import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import {
  ActionCellRenderer,
  CoinCellRenderer,
  PercentCellRenderer,
  PriceCellRenderer,
  SparklineCellRenderer,
  WatchlistCellRenderer,
} from './Renderers';
import { formatCompactUSD } from '../../utils/formatters';

const PAGE_SIZES = [10, 15, 25, 50];
const ROW_SELECTION = { mode: 'singleRow', checkboxes: false, enableClickSelection: true };
const DEFAULT_COL_DEF = { sortable: true, resizable: true };
const NO_ROWS = '<span class="grid-empty">No assets match your filters</span>';

function CryptoGrid({
  rowData,
  loading,
  theme,
  watchlist,
  onToggleWatchlist,
  onRowSelected,
  searchValue,
  onSearchChange,
  watchOnly,
  onWatchOnlyChange,
}) {
  const gridRef = useRef(null);

  const context = useMemo(
    () => ({ watchlist, onToggleWatchlist, onViewDetails: onRowSelected }),
    [watchlist, onToggleWatchlist, onRowSelected]
  );

  // Context changes don't repaint cells by themselves.
  useEffect(() => {
    gridRef.current?.api?.refreshCells({ columns: ['watch'], force: true });
  }, [watchlist]);

  const columnDefs = useMemo(
    () => [
      {
        colId: 'watch',
        headerName: '',
        width: 56,
        pinned: 'left',
        sortable: false,
        resizable: false,
        suppressMovable: true,
        cellRenderer: WatchlistCellRenderer,
      },
      { headerName: '#', field: 'market_cap_rank', width: 76, type: 'numericColumn', initialSort: 'asc' },
      { headerName: 'Coin', field: 'name', minWidth: 190, flex: 1.4, cellRenderer: CoinCellRenderer },
      {
        headerName: 'Price',
        field: 'current_price',
        minWidth: 130,
        type: 'numericColumn',
        cellRenderer: PriceCellRenderer,
        enableCellChangeFlash: true,
      },
      { headerName: '1h %', field: 'change1h', width: 110, type: 'numericColumn', cellRenderer: PercentCellRenderer },
      { headerName: '24h %', field: 'change24h', width: 115, type: 'numericColumn', cellRenderer: PercentCellRenderer },
      { headerName: '7d %', field: 'change7d', width: 110, type: 'numericColumn', cellRenderer: PercentCellRenderer },
      {
        headerName: 'Market Cap',
        field: 'market_cap',
        minWidth: 130,
        type: 'numericColumn',
        valueFormatter: ({ value }) => formatCompactUSD(value),
      },
      {
        headerName: 'Volume (24h)',
        field: 'total_volume',
        minWidth: 130,
        type: 'numericColumn',
        valueFormatter: ({ value }) => formatCompactUSD(value),
      },
      {
        colId: 'trend',
        headerName: '7d Trend',
        field: 'sparkline',
        width: 140,
        sortable: false,
        valueFormatter: () => '',
        cellRenderer: SparklineCellRenderer,
      },
      {
        colId: 'action',
        headerName: '',
        width: 100,
        sortable: false,
        resizable: false,
        cellRenderer: ActionCellRenderer,
      },
    ],
    []
  );

  const getRowId = useCallback((params) => params.data.id, []);

  const handleRowClicked = useCallback(
    (event) => {
      if (event.event?.target?.closest?.('[data-no-row-click]')) return;
      if (event.data) onRowSelected?.(event.data);
    },
    [onRowSelected]
  );

  const exportCsv = useCallback(() => {
    gridRef.current?.api?.exportDataAsCsv({
      fileName: `crypto-market-${new Date().toISOString().slice(0, 10)}.csv`,
      // Export raw numbers rather than formatted strings, excluding non-data action/watch columns
      columnKeys: ['market_cap_rank', 'name', 'current_price', 'change1h', 'change24h', 'change7d', 'market_cap', 'total_volume'],
      processCellCallback: (p) => {
        const field = p.column.getColDef().field;
        return field ? p.node?.data?.[field] : p.value;
      },
    });
  }, []);

  return (
    <div className="grid-section">
      <div className="grid-toolbar">
        <input
          type="search"
          className="input"
          placeholder="Search by name or symbol…"
          aria-label="Search assets"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <label className="toggle">
          <input type="checkbox" checked={watchOnly} onChange={(e) => onWatchOnlyChange(e.target.checked)} />
          Watchlist only
        </label>
        <span className="muted grid-count">{rowData.length} assets</span>
        <button type="button" className="btn" onClick={exportCsv} disabled={!rowData.length}>
          ⬇ Export CSV
        </button>
      </div>

      <div className={`ag-wrap ${theme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'}`}>
        <AgGridReact
          ref={gridRef}
          theme="legacy"
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={DEFAULT_COL_DEF}
          context={context}
          getRowId={getRowId}
          rowHeight={56}
          pagination
          paginationPageSize={15}
          paginationPageSizeSelector={PAGE_SIZES}
          rowSelection={ROW_SELECTION}
          onRowClicked={handleRowClicked}
          suppressCellFocus
          animateRows
          overlayNoRowsTemplate={NO_ROWS}
        />
        {loading && !rowData.length && <div className="chart-overlay">Loading market data…</div>}
      </div>
    </div>
  );
}

export default memo(CryptoGrid);