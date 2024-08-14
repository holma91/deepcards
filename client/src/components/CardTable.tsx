import React, { useEffect, useRef, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnDef,
} from '@tanstack/react-table';
import { Menu, Transition, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../types';

interface CardTableProps {
  cards: Card[];
  onDeleteCard: (cardId: string) => void;
  onSelectCard: (card: Card) => void;
}

const columnHelper = createColumnHelper<Card>();

const MAX_CELL_LENGTH = 40;

type CustomColumnMeta = {
  hideOnMobile?: boolean;
};

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
      meta: { hideOnMobile: true } as CustomColumnMeta,
    }),
    columnHelper.accessor('next_review', {
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      header: () => <span>Next Review</span>,
      meta: { hideOnMobile: true } as CustomColumnMeta,
    }),
    columnHelper.display({
      id: 'actions',
      cell: (info) => (
        <ActionMenu
          card={info.row.original}
          onDelete={() => onDeleteCard(info.row.original.id)}
          onEdit={() => onSelectCard(info.row.original)}
          onChat={(chatId) => handleChat(info.row.original, chatId)}
          rowIndex={info.row.index}
          totalRows={cards.length}
        />
      ),
    }),
  ] as ColumnDef<Card, any>[];

  const table = useReactTable({
    data: cards,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="w-full">
      <div className="mb-4 sm:px-0">
        <input
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          placeholder="Search cards..."
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      (header.column.columnDef.meta as CustomColumnMeta)?.hideOnMobile ? 'hidden sm:table-cell' : ''
                    }`}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <button onClick={header.column.getToggleSortingHandler()} className="ml-2">
                            {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                          </button>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-4 py-2 text-sm text-gray-700 ${
                      (cell.column.columnDef.meta as CustomColumnMeta)?.hideOnMobile ? 'hidden sm:table-cell' : ''
                    }`}
                  >
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
  rowIndex: number;
  totalRows: number;
}

const ITEMS_TO_SHOW_ABOVE = 3;

const ActionMenu: React.FC<ActionMenuProps> = ({ card, onDelete, onEdit, onChat, rowIndex, totalRows }) => {
  const [showAbove, setShowAbove] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shouldShowAbove = totalRows - rowIndex <= ITEMS_TO_SHOW_ABOVE;
    setShowAbove(shouldShowAbove);
  }, [rowIndex, totalRows]);

  if (totalRows <= 5) {
    return (
      <div className="flex space-x-2">
        <button
          onClick={onEdit}
          className="p-1 rounded text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
          title="Edit"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
        <button
          onClick={() => onChat(card.chat_id || undefined)}
          className="p-1 rounded text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
          title={card.chat_id ? 'Go to Chat' : 'Start Chat'}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
          title="Delete"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <Menu as="div" className="relative inline-block text-left" ref={menuRef}>
      <MenuButton className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </MenuButton>
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
          } right-0 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10`}
        >
          <div className="py-1">
            <MenuItem>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } group flex w-full items-center px-4 py-3 text-sm`}
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
                  } group flex w-full items-center px-4 py-3 text-sm`}
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
                    active ? 'bg-red-50 text-red-700' : 'text-red-600'
                  } group flex w-full items-center px-4 py-3 text-sm`}
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
