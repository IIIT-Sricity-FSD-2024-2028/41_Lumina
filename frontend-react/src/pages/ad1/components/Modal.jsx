/**
 * Modal — shared modal overlay with header, body, and footer slots.
 *
 * Usage:
 *   <Modal open={open} onClose={close} title="Edit Course">
 *     <Modal.Body>...</Modal.Body>
 *     <Modal.Footer>...</Modal.Footer>
 *   </Modal>
 */
import styles from './Modal.module.css';

export default function Modal({ open, onClose, title, children, maxWidth }) {
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={styles.content} style={maxWidth ? { maxWidth } : undefined}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.close} onClick={onClose}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

Modal.Body = function ModalBody({ children }) {
  return <div className={styles.body}>{children}</div>;
};

Modal.Footer = function ModalFooter({ children }) {
  return <div className={styles.footer}>{children}</div>;
};
