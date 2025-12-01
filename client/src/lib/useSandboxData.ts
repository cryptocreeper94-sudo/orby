import { useMemo } from 'react';
import { useMode } from './ModeContext';

export function useSandboxData<T>(liveData: T, demoData: T): T {
  const { isSandbox } = useMode();
  return useMemo(() => isSandbox ? demoData : liveData, [isSandbox, liveData, demoData]);
}

export function useSandboxDataWithFallback<T>(
  liveData: T | undefined,
  demoData: T,
  isLoading: boolean
): { data: T | undefined; isLoading: boolean } {
  const { isSandbox } = useMode();
  
  return useMemo(() => {
    if (isSandbox) {
      return { data: demoData, isLoading: false };
    }
    return { data: liveData, isLoading };
  }, [isSandbox, liveData, demoData, isLoading]);
}

export function useSandboxAction<TArgs extends unknown[], TResult>(
  liveAction: (...args: TArgs) => TResult,
  sandboxAction: (...args: TArgs) => TResult
): (...args: TArgs) => TResult {
  const { isSandbox } = useMode();
  
  return useMemo(() => {
    return (...args: TArgs) => {
      if (isSandbox) {
        return sandboxAction(...args);
      }
      return liveAction(...args);
    };
  }, [isSandbox, liveAction, sandboxAction]);
}

export function useSandboxMutation<TData, TVariables>(
  liveMutation: { mutate: (variables: TVariables) => void; isPending: boolean },
  options?: {
    onSandboxMutate?: (variables: TVariables) => void;
    sandboxDelay?: number;
  }
) {
  const { isSandbox } = useMode();
  
  const sandboxMutate = (variables: TVariables) => {
    if (options?.onSandboxMutate) {
      if (options.sandboxDelay) {
        setTimeout(() => options.onSandboxMutate?.(variables), options.sandboxDelay);
      } else {
        options.onSandboxMutate(variables);
      }
    }
    console.log('[Sandbox] Simulated mutation:', variables);
  };

  return {
    mutate: isSandbox ? sandboxMutate : liveMutation.mutate,
    isPending: isSandbox ? false : liveMutation.isPending
  };
}
