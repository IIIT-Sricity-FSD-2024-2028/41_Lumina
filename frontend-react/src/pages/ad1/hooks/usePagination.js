/**
 * usePagination — generic pagination hook.
 *
 * @param {Array}  items    - full list of items to paginate
 * @param {number} pageSize - items per page (default 6)
 * @returns {{ pagedItems, currentPage, totalPages, setPage, info }}
 */
import { useState, useMemo, useEffect } from 'react';

export default function usePagination(items, pageSize = 6) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset to page 1 when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  const pagedItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize]
  );

  const info = items.length > 0
    ? `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, items.length)} of ${items.length}`
    : 'No items to display';

  return {
    pagedItems,
    currentPage,
    totalPages,
    setPage: setCurrentPage,
    info,
  };
}
