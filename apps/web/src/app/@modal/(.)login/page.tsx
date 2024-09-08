export const runtime = "edge";
import Modal from "@jeton/ui/Modal";
import WalletAdapterButton from "@src/components/WalletAdapterButton";

export default function LoginModal() {
  return (
    <Modal>
      <WalletAdapterButton />
    </Modal>
  );
}
