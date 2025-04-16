export function Card({ children }: { children: React.ReactNode }) {
    return (
        <figure className="flex flex-col gap-1 rounded-xl bg-gray-950/5 p-1 inset-ring inset-ring-gray-950/5 dark:bg-white/10 dark:inset-ring-white/10">
            <div className="not-prose overflow-auto rounded-lg bg-white outline outline-white/5 dark:bg-gray-950/50">
                <div className="overflow-hidden">
                    {children}
                </div>
            </div>
        </figure>
    );
}
