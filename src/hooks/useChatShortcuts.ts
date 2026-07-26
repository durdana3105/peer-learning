import { useEffect, RefObject } from "react";

type UseChatShortcutsProps<T> = {
  searchInputRef: RefObject<HTMLInputElement>;
  items: T[];
  selectedItem: T | null;
  onSelect: (item: T) => void;
  onEscape?: () => void;
  getItemId: (item: T) => string;
};

export function useChatShortcuts<T>({
  searchInputRef,
  items,
  selectedItem,
  onSelect,
  onEscape,
  getItemId,
}: UseChatShortcutsProps<T>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Esc to close modals / go back / blur input
      if (e.key === "Escape") {
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
        if (onEscape) {
          onEscape();
        }
        return;
      }

      // Alt + Up/Down to navigate channels
      if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        
        if (items.length === 0) return;

        const currentIndex = selectedItem
          ? items.findIndex((item) => getItemId(item) === getItemId(selectedItem))
          : -1;

        let nextIndex = 0;
        if (currentIndex !== -1) {
          if (e.key === "ArrowUp") {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          } else {
            nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          }
        }

        onSelect(items[nextIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchInputRef, items, selectedItem, onSelect, onEscape, getItemId]);
}
