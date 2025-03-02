import { useToast as useToastShadcn } from '@/components/ui/use-toast';

export function useToast() {
    const { toast } = useToastShadcn();

    const showToast = (
        title: string,
        description?: string,
        variant: 'default' | 'destructive' | 'success' | 'warning' = 'default'
    ) => {
        toast({
            title,
            description,
            variant,
        });
    };

    const showSuccess = (title: string, description?: string) => {
        showToast(title, description, 'success');
    };

    const showError = (title: string, description?: string) => {
        showToast(title, description, 'destructive');
    };

    const showWarning = (title: string, description?: string) => {
        showToast(title, description, 'warning');
    };

    const showInfo = (title: string, description?: string) => {
        showToast(title, description, 'default');
    };

    return {
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };
}

export default useToast;
