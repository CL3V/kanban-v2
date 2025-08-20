import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";

interface DeleteBoardConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  boardTitle: string;
  isDeleting?: boolean;
}

export const DeleteBoardConfirmationDialog: React.FC<
  DeleteBoardConfirmationDialogProps
> = ({ isOpen, onClose, onConfirm, boardTitle, isDeleting = false }) => {
  const [inputValue, setInputValue] = React.useState("");
  const isValid = inputValue === boardTitle;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setInputValue("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" size="md">
      <div className="text-center p-10">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Board</h2>

        <div className="text-left bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800 mb-3">
            <strong>Warning:</strong> This action cannot be undone. This will
            permanently delete the board:
          </p>
          <p className="text-sm font-mono bg-red-100 text-red-900 px-2 py-1 rounded border">
            {boardTitle}
          </p>
          <p className="text-sm text-red-800 mt-3">
            All tasks, columns, and member assignments within this board will be
            permanently lost.
          </p>
        </div>

        <div className="text-left mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To confirm, type the board name <strong>"{boardTitle}"</strong>{" "}
            below:
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Enter board name..."
            disabled={isDeleting}
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isDeleting}
            className="flex-1"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Board
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
