import { AlertCircle, Check, Info, X } from "lucide-react";
import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
}

interface ToastProps {
	toast: Toast;
	onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
	useEffect(() => {
		const timer = setTimeout(() => {
			onClose(toast.id);
		}, 4000);

		return () => clearTimeout(timer);
	}, [toast.id, onClose]);

	const icons = {
		success: <Check className="h-5 w-5" />,
		error: <AlertCircle className="h-5 w-5" />,
		info: <Info className="h-5 w-5" />,
	};

	const styles = {
		success: "bg-green-600 text-white border-green-700",
		error: "bg-red-600 text-white border-red-700",
		info: "bg-blue-600 text-white border-blue-700",
	};

	return (
		<div
			className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-md animate-in slide-in-from-top-5 ${styles[toast.type]}`}
		>
			<div className="flex-shrink-0">{icons[toast.type]}</div>
			<p className="flex-1 text-sm font-medium">{toast.message}</p>
			<button
				type="button"
				onClick={() => onClose(toast.id)}
				className="flex-shrink-0 hover:opacity-70 transition-opacity"
				aria-label="Close notification"
			>
				<X className="h-4 w-4" />
			</button>
		</div>
	);
}

interface ToastContainerProps {
	toasts: Toast[];
	onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
	return (
		<div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
			{toasts.map((toast) => (
				<ToastItem key={toast.id} toast={toast} onClose={onClose} />
			))}
		</div>
	);
}

// Hook for managing toasts
export function useToast() {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const showToast = (message: string, type: ToastType = "info") => {
		const id = Math.random().toString(36).substr(2, 9);
		setToasts((prev) => [...prev, { id, message, type }]);
	};

	const closeToast = (id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	};

	return {
		toasts,
		showToast,
		closeToast,
		success: (message: string) => showToast(message, "success"),
		error: (message: string) => showToast(message, "error"),
		info: (message: string) => showToast(message, "info"),
	};
}
