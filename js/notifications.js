class NotificationSystem {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `
            p-4 rounded-lg shadow-lg transform transition-all duration-300
            ${type === 'success' ? 'bg-green-500' : 
              type === 'error' ? 'bg-red-500' : 
              'bg-blue-500'} text-white
        `;
        toast.textContent = message;
        
        this.container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

export const notifications = new NotificationSystem();
