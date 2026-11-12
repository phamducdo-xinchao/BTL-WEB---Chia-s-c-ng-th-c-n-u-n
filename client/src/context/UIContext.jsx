import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

// Context dùng chung: thông báo nhỏ (toast) và hộp xác nhận thay cho window.confirm
const UIContext = createContext(null);
export const useToast = () => useContext(UIContext).toast;
export const useConfirm = () => useContext(UIContext).confirm;

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const nextId = useRef(1);

  const push = useCallback((type, message) => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const toast = useMemo(() => ({ success: (m) => push('success', m), error: (m) => push('error', m) }), [push]);

  // confirm({ title, message, okText }) trả về Promise<boolean>
  const confirm = useCallback((opts) => new Promise((resolve) => setDialog({ ...opts, resolve })), []);

  function close(result) {
    dialog.resolve(result);
    setDialog(null);
  }

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => e.key === 'Escape' && close(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <UIContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>)}
      </div>
      {dialog && (
        <div className="overlay" onClick={() => close(false)}>
          <div className="dialog" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{dialog.title}</h2>
            <p>{dialog.message}</p>
            <div className="actions">
              <button className="btn btn-ghost" autoFocus onClick={() => close(false)}>Hủy</button>
              <button className="btn btn-danger" onClick={() => close(true)}>{dialog.okText || 'Đồng ý'}</button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}
