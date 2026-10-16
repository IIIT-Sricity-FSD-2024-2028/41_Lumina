/**
 * PrereqDropdown — searchable prerequisite selector with tags.
 * Extracted from CourseCatalog.
 */
import { useState, useMemo, useEffect, useRef } from 'react';
import styles from './PrereqDropdown.module.css';

export default function PrereqDropdown({ courses, tags, setTags, excludeCode }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter(
      (c) =>
        c.code !== excludeCode &&
        !tags.includes(c.code) &&
        (q === '' || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
    );
  }, [courses, tags, excludeCode, query]);

  const addTag = (code) => {
    if (!tags.includes(code)) setTags([...tags, code]);
    setQuery('');
  };

  const removeTag = (idx) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {tags.length > 0 && (
        <div className={styles.tagsRow}>
          {tags.map((code, i) => (
            <span key={code} className={styles.tag}>
              <span className={styles.tagCode}>{code}</span>
              <button type="button" className={styles.tagRemove} onClick={() => removeTag(i)}>&times;</button>
            </span>
          ))}
        </div>
      )}
      <input
        className={styles.searchInput}
        placeholder="Type to search and select courses..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <div className={styles.dropdown}>
          {matches.length === 0 ? (
            <div className={styles.empty}>No matching courses found</div>
          ) : (
            matches.map((c) => (
              <div key={c.code} className={styles.item}
                onMouseDown={(e) => { e.preventDefault(); addTag(c.code); }}>
                <span className={styles.itemCode}>{c.code}</span>
                <span className={styles.itemName}>{c.name}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
