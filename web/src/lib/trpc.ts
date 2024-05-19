import type { AppRouter } from '../../../backend/src/index';
import { createTRPCReact } from '@trpc/react-query';

export const trpc = createTRPCReact<AppRouter>();