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
import { Menu, Transition, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../types';

interface CardTableProps {
  cards: Card[];
  onDeleteCard: (cardId: string) => void;
  onSelectCard: (card: Card) => void; // Add this line
}

const columnHelper = createColumnHelper<Card>();

const MAX_CELL_LENGTH = 40;
const CARDS_TO_SHOW_ABOVE = 3;

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

const CardTable: React.FC<CardTableProps> = ({ cards, onDeleteCard, onSelectCard }) => {
  const navigate = useNavigate();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const handleChat = (card: Card, chatId?: string) => {
    if (chatId) {
      navigate(`/chat/${chatId}`);
    } else {
      navigate(`/chat?card_id=${card.id}`);
    }
  };

  const columns = [
    columnHelper.accessor('front', {
      cell: (info) => truncateText(info.getValue(), MAX_CELL_LENGTH),
      header: () => <span>Front</span>,
    }),
    columnHelper.accessor('back', {
      cell: (info) => truncateText(info.getValue(), MAX_CELL_LENGTH),
      header: () => <span>Back</span>,
    }),
    columnHelper.accessor('next_review', {
      cell: (info) => new Date(info.getValue()).toLocaleString(),
      header: () => <span>Next Review</span>,
    }),
    columnHelper.display({
      id: 'actions',
      cell: (info) => (
        <ActionMenu
          card={info.row.original}
          onDelete={() => onDeleteCard(info.row.original.id)}
          onEdit={() => onSelectCard(info.row.original)}
          onChat={(chatId) => handleChat(info.row.original, chatId)}
          showAbove={info.row.index >= cards.length - CARDS_TO_SHOW_ABOVE}
        />
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
      <div className="mb-4 mt-1">
        <input
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="p-2 font-lg border w-full"
          placeholder="Search all columns..."
        />
      </div>
      <div className="overflow-x-auto border">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <button onClick={header.column.getToggleSortingHandler()} className="ml-2">
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

interface ActionMenuProps {
  card: Card;
  onDelete: () => void;
  onEdit: () => void;
  onChat: (chatId?: string) => void;
  showAbove: boolean;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ card, onDelete, onEdit, onChat, showAbove }) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <MenuButton className="p-1 rounded-full hover:bg-gray-200 focus:outline-none">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </MenuButton>
      </div>
      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems
          className={`absolute ${
            showAbove ? 'bottom-full mb-2' : 'top-full mt-2'
          } right-0 w-56 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50`}
        >
          <div className="px-1 py-1">
            <MenuItem>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                  onClick={onEdit}
                >
                  Edit
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                  onClick={() => onChat(card.chat_id || undefined)}
                >
                  {card.chat_id ? 'Go to Chat' : 'Start Chat'}
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-red-100 text-red-900' : 'text-red-700'
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                  onClick={onDelete}
                >
                  Delete
                </button>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
};

export default CardTable;
