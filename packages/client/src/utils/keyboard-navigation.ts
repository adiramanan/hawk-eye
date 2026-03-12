export function getNextGroupIndex(key: string, currentIndex: number, total: number) {
  if (total <= 0) {
    return currentIndex;
  }

  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (currentIndex + 1) % total;
    case 'ArrowLeft':
    case 'ArrowUp':
      return (currentIndex - 1 + total) % total;
    case 'Home':
      return 0;
    case 'End':
      return total - 1;
    default:
      return currentIndex;
  }
}

export function isGroupNavigationKey(key: string) {
  return (
    key === 'ArrowRight' ||
    key === 'ArrowLeft' ||
    key === 'ArrowDown' ||
    key === 'ArrowUp' ||
    key === 'Home' ||
    key === 'End'
  );
}
