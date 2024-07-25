import React, { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { Card } from '../hooks/useCards';

interface CardTableProps {
  cards: Card[];
  onDeleteCard: (cardId: string) => void;
}

const columnHelper = createColumnHelper<Card>();

const CardTable: React.FC<CardTableProps> = ({ cards, onDeleteCard }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = [
    columnHelper.accessor('front', {
      cell: (info) => info.getValue(),
      header: () => <span>Front</span>,
    }),
    columnHelper.accessor('back', {
      cell: (info) => info.getValue(),
      header: () => <span>Back</span>,
    }),
    columnHelper.accessor('created_at', {
      cell: (info) => new Date(info.getValue()).toLocaleString(),
      header: () => <span>Created At</span>,
    }),
    columnHelper.display({
      id: 'actions',
      cell: (props) => (
        <button
          onClick={() => onDeleteCard(props.row.original.id)}
          className="text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      ),
    }),
  ];

  const table = useReactTable({
    data: cards,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div>
      <div className="mb-4">
        <input
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="p-2 font-lg shadow border border-block w-full"
          placeholder="Search all columns..."
        />
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  {header.column.getCanSort() && (
                    <button
                      onClick={header.column.getToggleSortingHandler()}
                      className="ml-2"
                    >
                      {header.column.getIsSorted() === 'asc' ? '🔼' : '🔽'}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CardTable;
