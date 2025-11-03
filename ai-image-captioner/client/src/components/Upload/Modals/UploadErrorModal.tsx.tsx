import Modal from "./Modal";

type UploadErrorModalProps = {
  open: boolean;
  message: string | null;
  onClose: () => void;
};

export default function UploadErrorModal({ open, message, onClose }: UploadErrorModalProps) {
  return (
    <Modal
      open={open}
      title="Upload Error"
      confirmText="Got it"
      onConfirm={onClose}
      tone="default"
    >
      {/* Main message */}
      <p className="text-white/90" data-testid="upload-error-message">
        {message ?? "Something went wrong with your upload. Please try again with a supported image."}
      </p>

      {/* Tips list */}
      <ul className="mt-3 list-disc pl-5 text-white/70 text-xs space-y-1">
        <li>
          <span className="text-white/80">Supported formats:</span> JPEG, JPG, PNG
        </li>
        <li>Try a smaller image if yours is extremely large</li>
      </ul>
    </Modal>
  );
}
