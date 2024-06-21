import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AlertQuota.css";

//documentazione a https://www.makeuseof.com/react-toastify-custom-alerts-create/

function AlertQuota() {
  return (
    <div>
      <ToastContainer position="top-left" autoClose={2500} />
    </div>
  );
}

export default AlertQuota;
