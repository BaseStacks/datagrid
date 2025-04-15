import Markdown from 'react-markdown';

interface PageHeaderProps {
    category?: string;
    title: string;
    description: string;
}

export function PageHeader(props: PageHeaderProps) {
    const {
        category,
        title,
        description
    } = props;

    return (
        <header>
            {
                category && (
                    <p className="font-mono text-xs/6 font-medium tracking-widest text-gray-600 uppercase dark:text-gray-400">
                        {category}
                    </p>)
            }
            <h1 className="mt-2 text-3xl font-medium tracking-tight text-gray-950 dark:text-white">
                {title}
            </h1>
            <div className="text-base/7 text-gray-700 dark:text-gray-300">
                <Markdown>
                    {description}
                </Markdown>
            </div>
        </header >
    );
};
