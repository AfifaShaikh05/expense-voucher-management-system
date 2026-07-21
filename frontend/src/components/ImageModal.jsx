import { useEffect } from 'react';
import styles from './ImageModal.module.css';

const ImageModal = ({ imageUrl, altText, isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close image preview">
        X
      </button>
      <img
        src={imageUrl}
        alt={altText}
        className={styles.image}
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
};

export default ImageModal;