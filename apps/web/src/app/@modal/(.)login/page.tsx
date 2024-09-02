export const runtime = "edge";
import Modal from "@jeton/ui/Modal";
import GoogleAuth from "./GoogleAuth";

export default function LoginModal() {
  return (
    <Modal>
      <GoogleAuth />
    </Modal>
  );
}
