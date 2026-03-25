'use client';

import { type HTMLAttributes } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={clsx('bg-white rounded-lg shadow p-6', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div className={clsx('border-b border-gray-200 pb-4 mb-4', className)} {...props} />
  );
}

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'info' | 'warning' | 'error' | 'success';
}

export function Alert({
  type = 'info',
  className,
  children,
  ...props
}: AlertProps) {
  const styles = {
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
  };

  return (
    <div
      className={clsx('px-4 py-3 rounded-md', styles[type], className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {}

export function Table({ className, ...props }: TableProps) {
  return (
    <table
      className={clsx('w-full border-collapse', className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.TableHTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={clsx('bg-gray-100 border-b border-gray-200', className)}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: React.TableHTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={clsx('divide-y divide-gray-200', className)} {...props} />
  );
}

interface TableRowProps extends React.TableHTMLAttributes<HTMLTableRowElement> {
  isHeader?: boolean;
}

export function TableRow({ isHeader, className, ...props }: TableRowProps) {
  return (
    <tr
      className={clsx(
        isHeader ? '' : 'hover:bg-gray-50 transition',
        className
      )}
      {...props}
    />
  );
}

interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {
  isHeader?: boolean;
}

export function TableCell({
  isHeader,
  className,
  ...props
}: TableCellProps) {
  if (isHeader) {
    return (
      <th
        className={clsx(
          'px-4 py-2 text-left text-sm font-semibold text-gray-700',
          className
        )}
        {...props}
      />
    );
  }

  return (
    <td
      className={clsx('px-4 py-2 text-sm text-gray-600', className)}
      {...props}
    />
  );
}

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-lg z-50 flex flex-col">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </div>
    </>
  );
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
}: DialogProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
          <h2 className="text-lg font-bold mb-4">{title}</h2>
          <div className="mb-6">{children}</div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              {cancelText}
            </button>
            {onConfirm && (
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
