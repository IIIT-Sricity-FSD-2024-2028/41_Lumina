/**
 * Pagination — page navigation controls with info text.
 *
 * Usage:
 *   <Pagination
 *     currentPage={page}
 *     totalPages={total}
 *     onPageChange={setPage}
 *     info="Showing 1 to 6 of 24 courses"
 *   />
 */
import styles from './Pagination.module.css';
import { useMemo } from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange, info }) {
  const pageButtons = useMemo(() => {
    const maxBtns = 5;
    let start = Math.max(1, currentPage - Math.floor(maxBtns / 2));
    let end = Math.min(totalPages, start + maxBtns - 1);
    if (end - start < maxBtns - 1) start = Math.max(1, end - maxBtns + 1);
    const btns = [];
    for (let i = start; i <= end; i++) btns.push(i);
    return btns;
  }, [currentPage, totalPages]);

  return (
    <div className={styles.pagination}>
      <span className={styles.info}>{info}</span>
      <div className={styles.controls}>
        <button
          className={styles.btn}
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </button>
        {pageButtons.map((p) => (
          <button
            key={p}
            className={`${styles.btn} ${p === currentPage ? styles.active : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          className={styles.btn}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
