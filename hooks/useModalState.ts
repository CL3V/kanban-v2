import { useReducer, useCallback } from "react";
import { Task, TaskStatus } from "@/types/kanban";

export type ModalMode =
  | "create"
  | "view"
  | "edit"
  | "board-settings"
  | "closed";

interface ModalState {
  mode: ModalMode;
  isOpen: boolean;
  selectedTask: Task | null;
  activeColumnStatus: TaskStatus | null;
}

type ModalAction =
  | { type: "OPEN_CREATE_TASK"; payload: { columnStatus: TaskStatus } }
  | { type: "OPEN_VIEW_TASK"; payload: { task: Task } }
  | { type: "OPEN_EDIT_TASK"; payload: { task: Task } }
  | { type: "SWITCH_TO_EDIT" }
  | { type: "OPEN_BOARD_SETTINGS" }
  | { type: "CLOSE_MODAL" };

const initialState: ModalState = {
  mode: "closed",
  isOpen: false,
  selectedTask: null,
  activeColumnStatus: null,
};

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case "OPEN_CREATE_TASK":
      return {
        mode: "create",
        isOpen: true,
        selectedTask: null,
        activeColumnStatus: action.payload.columnStatus,
      };

    case "OPEN_VIEW_TASK":
      return {
        mode: "view",
        isOpen: true,
        selectedTask: action.payload.task,
        activeColumnStatus: null,
      };

    case "OPEN_EDIT_TASK":
      return {
        mode: "edit",
        isOpen: true,
        selectedTask: action.payload.task,
        activeColumnStatus: null,
      };

    case "SWITCH_TO_EDIT":
      if (state.selectedTask) {
        return {
          ...state,
          mode: "edit",
        };
      }
      return state;

    case "OPEN_BOARD_SETTINGS":
      return {
        mode: "board-settings",
        isOpen: true,
        selectedTask: null,
        activeColumnStatus: null,
      };

    case "CLOSE_MODAL":
      return initialState;

    default:
      return state;
  }
}

export const useModalState = () => {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  const openCreateTask = useCallback((columnStatus: TaskStatus) => {
    dispatch({ type: "OPEN_CREATE_TASK", payload: { columnStatus } });
  }, []);

  const openViewTask = useCallback((task: Task) => {
    dispatch({ type: "OPEN_VIEW_TASK", payload: { task } });
  }, []);

  const openEditTask = useCallback((task: Task) => {
    dispatch({ type: "OPEN_EDIT_TASK", payload: { task } });
  }, []);

  const switchToEdit = useCallback(() => {
    dispatch({ type: "SWITCH_TO_EDIT" });
  }, []);

  const openBoardSettings = useCallback(() => {
    dispatch({ type: "OPEN_BOARD_SETTINGS" });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: "CLOSE_MODAL" });
  }, []);

  return {
    ...state,
    openCreateTask,
    openViewTask,
    openEditTask,
    switchToEdit,
    openBoardSettings,
    closeModal,
    // Derived states
    isTaskModalOpen:
      state.isOpen && ["create", "view", "edit"].includes(state.mode),
    isBoardSettingsOpen: state.isOpen && state.mode === "board-settings",
    isEditing: state.mode === "edit",
    isCreating: state.mode === "create",
  };
};
