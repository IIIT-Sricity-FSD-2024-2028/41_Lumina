/**
 * DataTable — shared table wrapper with header, body, and empty state.
 *
 * Usage:
 *   <DataTable columns={['Code','Name']} emptyText="No courses found.">
 *     {rows.map(r => <tr key={r.id}>...</tr>)}
 *   </DataTable>
 */
import styles from './DataTable.module.css';

export default function DataTable({ columns, children, emptyText }) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={i}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {isEmpty ? (
          <tr>
            <td colSpan={columns.length} className={styles.empty}>
              {emptyText || 'No data available.'}
            </td>
          </tr>
        ) : (
          children
        )}
      </tbody>
    </table>
  );
}
