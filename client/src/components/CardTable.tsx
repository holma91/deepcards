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
import { Card } from '../types';

interface CardTableProps {
  cards: Card[];
  onDeleteCard: (cardId: string) => void;
}

const columnHelper = createColumnHelper<Card>();

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

const CardTable: React.FC<CardTableProps> = ({ cards, onDeleteCard }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const MAX_CELL_LENGTH = 40;

  const columns = [
    columnHelper.accessor('front', {
      cell: (info) => truncateText(info.getValue(), MAX_CELL_LENGTH),
      header: () => <span>Front</span>,
    }),
    columnHelper.accessor('back', {
      cell: (info) => truncateText(info.getValue(), MAX_CELL_LENGTH),
      header: () => <span>Back</span>,
    }),
    columnHelper.accessor('createdAt', {
      cell: (info) => new Date(info.getValue()).toLocaleString(),
      header: () => <span>Created At</span>,
    }),
    columnHelper.display({
      id: 'actions',
      cell: (props) => (
        <button
          onClick={() => onDeleteCard(props.row.original.id)}
          className="text-red-600 hover:text-red-800"
          aria-label="Delete card"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
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
    <div className="w-full">
      <div className="mb-4">
        <input
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="p-2 font-lg shadow border border-block w-full"
          placeholder="Search all columns..."
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
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
    </div>
  );
};

export default CardTable;
