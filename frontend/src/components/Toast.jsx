import { useApp } from '../hooks/useApp';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
      <div className={`toast show align-items-center text-bg-${toast.variant} border-0`} role="alert">
        <div className="d-flex">
          <div className="toast-body">{toast.message}</div>
        </div>
      </div>
    </div>
  );
}
