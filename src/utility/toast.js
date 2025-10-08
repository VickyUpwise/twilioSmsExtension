// toast.js
import { toast } from "react-toastify";

const TOAST_IDS = {
  global: "global-toast",
  error: "error-toast",
};

export function showToast(msg, type = "info") {
  const id = type === "error" ? TOAST_IDS.error : TOAST_IDS.global;

  if (toast.isActive(id)) {
    toast.update(id, { render: msg, type, autoClose: 3000, containerId: "main" });
  } else {
    toast(msg, { toastId: id, type, autoClose: 3000, containerId: "main" });
  }
}
export function dismissToast() {
  if (toast.isActive(ONE_TOAST)) {
    toast.dismiss(ONE_TOAST);
  }
}

export function safeUpdateToast(msg, type = "info") {
  if (toast.isActive(ONE_TOAST)) {
    toast.update(ONE_TOAST, { render: msg, type, containerId: "main" });
  } else {
    showToast(msg);
  }
}
