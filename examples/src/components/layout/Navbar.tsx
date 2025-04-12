import { Link } from '@tanstack/react-router';
import { BookOpen, Construction } from 'lucide-react';

const gettingStartedRoutes = [{
    icon: BookOpen,
    path: '/',
    title: 'Introduction',
},
{
    icon: Construction,
    path: '/getting-started/installation',
    title: 'Installation',
}];

const guidesRoutes = [{
    path: '/guides/basic',
    title: 'Basic',
}, {
    path: '/guides/cell-selection',
    title: 'Cell selection',
}, {
    path: '/guides/editable-data',
    title: 'Editable data',
}];

export function Navbar() {
    return (
        <div className="absolute inset-0">
            <div className="sticky top-14.25 bottom-0 left-0 h-full max-h-[calc(100dvh-(var(--spacing)*14.25))] w-2xs overflow-y-auto p-6">
                <nav className="flex flex-col gap-8">
                    <ul className="flex flex-col gap-2">
                        {gettingStartedRoutes.map((route) => (
                            <li key={route.path} className="-ml-px flex flex-col items-start gap-2">
                                <Link
                                    to={route.path}
                                    className="group inline-flex items-center gap-3 text-base/8 text-gray-600 sm:text-sm/7 dark:text-gray-300 **:data-outline:stroke-gray-400 dark:**:data-outline:stroke-gray-500 **:[svg]:first:size-5 **:[svg]:first:sm:size-4 hover:text-gray-950 hover:**:data-highlight:fill-gray-300 hover:**:data-outline:stroke-gray-950 dark:hover:text-white dark:hover:**:data-highlight:fill-gray-600 dark:hover:**:data-outline:stroke-white aria-[current]:font-semibold aria-[current]:text-gray-950 aria-[current]:**:data-highlight:fill-gray-300 aria-[current]:**:data-outline:stroke-gray-950 dark:aria-[current]:text-white dark:aria-[current]:**:data-highlight:fill-gray-600 dark:aria-[current]:**:data-outline:stroke-white"
                                    activeProps={{ 'aria-current': 'page' }}
                                >
                                    {<route.icon size={30} strokeWidth={2} absoluteStrokeWidth />} {route.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="flex flex-col gap-3">
                        <h3 className="font-mono text-sm/6 font-medium tracking-widest text-gray-500 uppercase sm:text-xs/6 dark:text-gray-400">
                            guides
                        </h3>
                        <ul className="flex flex-col gap-2 border-l dark:border-[color-mix(in_oklab,_var(--color-gray-950),white_20%)] border-[color-mix(in_oklab,_var(--color-gray-950),white_90%)]">
                            {guidesRoutes.map((route) => (
                                <li key={route.path} className="-ml-px flex flex-col items-start gap-2">
                                    <Link
                                        to={route.path}
                                        className="inline-block border-l border-transparent text-base/8 text-gray-600 hover:border-gray-950/25 hover:text-gray-950 sm:text-sm/6 dark:text-gray-300 dark:hover:border-white/25 dark:hover:text-white aria-[current]:border-gray-950 aria-[current]:font-semibold aria-[current]:text-gray-950 dark:aria-[current]:border-white dark:aria-[current]:text-white pl-5 sm:pl-4"
                                        activeProps={{ 'aria-current': 'page' }}
                                    >
                                        {route.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>
            </div>
        </div>
    );
}
