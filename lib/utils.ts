import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Custom hook for card click expansion
export function useCardExpansion() {
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate 80% of viewport
    const targetWidth = viewportWidth * 0.8;
    const targetHeight = viewportHeight * 0.8;
    
    // Calculate position to center the card
    const left = (viewportWidth - targetWidth) / 2;
    const top = (viewportHeight - targetHeight) / 2;
    
    // Apply expansion styles
    card.style.position = 'fixed';
    card.style.zIndex = '1000';
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    card.style.width = `${targetWidth}px`;
    card.style.height = `${targetHeight}px`;
    card.style.transition = 'all 0.3s ease-in-out';
    card.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
    card.style.borderRadius = '12px';
    card.style.overflow = 'auto';
    card.style.backgroundColor = 'hsl(var(--card))';
    card.style.border = '1px solid hsl(var(--border))';
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'card-backdrop';
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100vw';
    backdrop.style.height = '100vh';
    backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    backdrop.style.zIndex = '999';
    backdrop.style.backdropFilter = 'blur(4px)';
    backdrop.style.transition = 'opacity 0.3s ease-in-out';
    backdrop.onclick = () => handleClose(card);
    document.body.appendChild(backdrop);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.width = '30px';
    closeButton.style.height = '30px';
    closeButton.style.borderRadius = '50%';
    closeButton.style.border = 'none';
    closeButton.style.backgroundColor = 'hsl(var(--muted))';
    closeButton.style.color = 'hsl(var(--muted-foreground))';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.zIndex = '1001';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.onclick = (e) => {
      e.stopPropagation();
      handleClose(card);
    };
    card.appendChild(closeButton);
  };

  const handleClose = (card: HTMLElement) => {
    // Reset card styles
    card.style.position = '';
    card.style.zIndex = '';
    card.style.left = '';
    card.style.top = '';
    card.style.width = '';
    card.style.height = '';
    card.style.transition = '';
    card.style.boxShadow = '';
    card.style.borderRadius = '';
    card.style.overflow = '';
    card.style.backgroundColor = '';
    card.style.border = '';
    
    // Remove close button
    const closeButton = card.querySelector('button');
    if (closeButton) {
      closeButton.remove();
    }
    
    // Remove backdrop
    const backdrop = document.getElementById('card-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  };

  return { handleClick };
} 