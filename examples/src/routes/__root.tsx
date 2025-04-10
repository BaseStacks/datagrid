import { createRootRoute } from '@tanstack/react-router';
import { Header } from '../components/layout/Header';
import { Body } from '../components/layout/Body';

export const Route = createRootRoute({
    component: () => (
        <div className="isolate">
            <Header />
            <Body />
        </div>
    ),
});
