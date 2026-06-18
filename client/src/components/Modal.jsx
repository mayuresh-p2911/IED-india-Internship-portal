import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modal, setModal] = useState({ open: false, title: '', body: '', footer: '' });

  const showModal = useCallback((title, bodyHTML, footerHTML = '') => {
    setModal({ open: true, title, body: bodyHTML, footer: footerHTML });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ open: false, title: '', body: '', footer: '' });
  }, []);

  const value = useMemo(() => ({ modal, showModal, closeModal }), [modal, showModal, closeModal]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modal.open && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h3>{modal.title}</h3>
              <button className="modal-close" onClick={closeModal}><X size={18} /></button>
            </div>
            <div className="modal-body" dangerouslySetInnerHTML={{ __html: modal.body }} />
            {modal.footer && (
              <div className="modal-footer" dangerouslySetInnerHTML={{ __html: modal.footer }} />
            )}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}

export default ModalContext;
